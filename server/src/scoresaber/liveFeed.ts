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
  /** Lets a test supply its own socket */
  connect?: (url: string) => Socket;
  log?: (message: string) => void;
  /** Called with the player's id for every score on the feed */
  onScore: (playerId: string) => void;
  /** Waiting times before reconnecting: first, and at most */
  reconnect?: { maxMs: number; minMs: number };
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
  connect = (url) => new WebSocket(url),
  log = console.log,
  onScore,
  reconnect = { minMs: 1000, maxMs: 60_000 },
  setTimer = setTimeout,
  url,
}: Options) => {
  let socket: Socket | undefined;
  let stopped = false;
  let waitMs = reconnect.minMs;

  const open = () => {
    if (stopped) return;

    socket = connect(url);

    socket.addEventListener('open', () => {
      log('Live feed connected');
      // It works again, so the next outage starts with a short wait
      waitMs = reconnect.minMs;
    });

    socket.addEventListener('message', ({ data }) => {
      const playerId = playerIdOf(data);

      if (playerId !== undefined) onScore(playerId);
    });

    // The feed goes down now and then. Try again, waiting longer each time,
    // so a long outage does not turn into a flood of attempts.
    socket.addEventListener('close', () => {
      if (stopped) return;

      log(`Live feed closed, reconnecting in ${waitMs / 1000} s`);
      setTimer(open, waitMs);
      waitMs = Math.min(waitMs * 2, reconnect.maxMs);
    });

    // An error is always followed by a close event, which reconnects
    socket.addEventListener('error', () => {});
  };

  return {
    start: open,
    stop: () => {
      stopped = true;
      socket?.close();
    },
  };
};

export { createLiveFeed, playerIdOf };
export type { Socket };
