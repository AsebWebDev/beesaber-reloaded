import { z } from 'zod';

/**
 * ScoreSaber's live feed: a WebSocket that sends a message for every score
 * set anywhere in the world, the moment it is set.
 *
 * We only take one thing from a message: whose score it is. Everything else
 * is fetched through the regular API afterwards, which is documented and
 * checked. The feed is neither, so nothing here trusts its shape beyond that
 * one field, and a message that looks different is skipped.
 */

const scoreMessage = z.object({
  commandName: z.literal('score'),
  commandData: z.object({
    score: z.object({
      leaderboardPlayerInfo: z.object({ id: z.string().regex(/^\d{1,20}$/) }),
    }),
  }),
});

/** The part of the browser-style WebSocket this module uses */
type Socket = {
  addEventListener: (
    type: 'close' | 'error' | 'message' | 'open',
    listener: (event: { data?: unknown }) => void
  ) => void;
  close: () => void;
};

type Options = {
  clearTimer?: (timer: unknown) => void;
  /** Lets a test supply its own socket */
  connect?: (url: string) => Socket;
  /**
   * How long the feed may stay silent before the connection is taken for
   * dead. Scores arrive every few seconds around the clock, so minutes of
   * silence mean the connection is gone without anyone having said so.
   */
  idleTimeoutMs?: number;
  log?: (message: string) => void;
  /** At most this many scores are being handled at once; more are dropped */
  maxPending?: number;
  now?: () => number;
  /** Called with the player's id for every score on the feed */
  onScore: (playerId: string) => Promise<unknown> | void;
  reconnect?: {
    /** The longest wait between two attempts */
    maxMs: number;
    /** The wait before the first attempt */
    minMs: number;
    /** A connection that held this long counts as working */
    stableAfterMs: number;
  };
  setTimer?: (callback: () => void, ms: number) => unknown;
  url: string;
};

/** Reads the player id out of a feed message, or nothing if it is no score */
const playerIdOf = (data: unknown): string | undefined => {
  if (typeof data !== 'string') return undefined;

  try {
    const parsed = scoreMessage.safeParse(JSON.parse(data));

    return parsed.success
      ? parsed.data.commandData.score.leaderboardPlayerInfo.id
      : undefined;
  } catch {
    // Not JSON, like the greeting the feed sends first
    return undefined;
  }
};

const createLiveFeed = ({
  clearTimer = (timer) => clearTimeout(timer as NodeJS.Timeout),
  connect = (url) => new WebSocket(url),
  idleTimeoutMs = 5 * 60_000,
  log = console.log,
  maxPending = 50,
  now = Date.now,
  onScore,
  reconnect = { minMs: 1000, maxMs: 60_000, stableAfterMs: 30_000 },
  setTimer = setTimeout,
  url,
}: Options) => {
  let stopped = false;
  let waitMs = reconnect.minMs;
  let socket: Socket | undefined;
  let idleTimer: unknown;
  // Counts connections. Events of an older connection are ignored.
  let generation = 0;
  let pending = 0;
  let dropped = 0;
  let lastMessageAt: number | undefined;

  const handle = (playerId: string) => {
    // If handling cannot keep up, say because the database is slow, scores
    // are dropped instead of piling up in memory. The periodic sync picks
    // up whatever was missed.
    if (pending >= maxPending) {
      dropped += 1;
      if (dropped % 100 === 1)
        log(`Live feed: handling is too slow, ${dropped} scores dropped`);

      return;
    }

    pending += 1;
    Promise.resolve()
      .then(() => onScore(playerId))
      .catch((error: unknown) =>
        log(`Live feed handler failed: ${String(error)}`)
      )
      .finally(() => {
        pending -= 1;
      });
  };

  const open = () => {
    if (stopped) return;

    generation += 1;

    const mine = generation;
    const current = connect(url);
    let openedAt: number | undefined;

    socket = current;

    const isCurrent = () => mine === generation && !stopped;

    const reconnectLater = (why: string) => {
      if (!isCurrent()) return;

      // From here on, nothing this connection does matters any more
      generation += 1;
      clearTimer(idleTimer);

      // Only a connection that held for a while resets the waiting time. One
      // that is accepted and dropped right away keeps backing off, so a
      // broken server is not retried every second forever.
      if (openedAt !== undefined && now() - openedAt >= reconnect.stableAfterMs)
        waitMs = reconnect.minMs;

      log(`Live feed ${why}, reconnecting in ${waitMs / 1000} s`);
      setTimer(open, waitMs);
      waitMs = Math.min(waitMs * 2, reconnect.maxMs);
    };

    // A connection can die without a close event, for example when a network
    // device in between forgets about it. Silence is the only sign.
    const watchForSilence = () => {
      clearTimer(idleTimer);
      idleTimer = setTimer(() => {
        if (!isCurrent()) return;

        try {
          current.close();
        } catch {
          // Already gone, which is what we are dealing with
        }
        reconnectLater(`silent for ${idleTimeoutMs / 1000} s`);
      }, idleTimeoutMs);
    };

    watchForSilence();

    current.addEventListener('open', () => {
      if (!isCurrent()) return;

      openedAt = now();
      log('Live feed connected');
    });

    current.addEventListener('message', ({ data }) => {
      if (!isCurrent()) return;

      lastMessageAt = now();
      watchForSilence();

      const playerId = playerIdOf(data);

      if (playerId !== undefined) handle(playerId);
    });

    current.addEventListener('close', () => reconnectLater('closed'));

    // An error is always followed by a close event, which reconnects
    current.addEventListener('error', () => {});
  };

  return {
    start: open,
    /** For a health check or a log line: is the feed alive? */
    status: () => ({ lastMessageAt, pending, dropped }),
    stop: () => {
      stopped = true;
      clearTimer(idleTimer);
      socket?.close();
    },
  };
};

export { createLiveFeed, playerIdOf };
export type { Socket };
