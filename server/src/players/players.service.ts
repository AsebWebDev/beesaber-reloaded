import { ScoreSaberError } from '../scoresaber/client.ts';
import {
  toLeaderboardRow,
  toPlayerRow,
  toScoreRow,
} from '../scoresaber/mapping.ts';

import type { JobQueue, SyncPriority } from '../jobs/queue.ts';
import type { ScoreSaberClient } from '../scoresaber/client.ts';
import type { PlayersRepository } from './players.repository.ts';

/**
 * What the app does with players: look them up on ScoreSaber and copy their
 * profile and scores into our database. Knows the steps, but neither HTTP
 * nor SQL.
 *
 * Two speeds on purpose:
 * - A profile is one request to ScoreSaber, so `ensureProfile` does it right
 *   away and the caller can wait for it.
 * - The scores can be dozens of requests, so `requestSync` only puts a job on
 *   the queue. The job later runs `runSync`.
 */

type SyncRequest = {
  /** False when the last sync was so recent that none was queued */
  queued: boolean;
};

type SyncResult = {
  /** Scores on leaderboards the player had no score on before */
  added: number;
  /** True when this was the first complete fetch of the player's scores */
  firstSync: boolean;
  /** Scores that beat the player's own previous score */
  improved: number;
};

/**
 * Why a sync failed, as stored on the player and shown to users. A short
 * code on purpose: the text of an exception can contain SQL, parameters or
 * the raw answer of another service, and has no business in an API response.
 */
type SyncErrorCode =
  'internal' | 'not_found' | 'scoresaber_unavailable' | 'unexpected_response';

const syncErrorCode = (error: unknown): SyncErrorCode => {
  if (!(error instanceof ScoreSaberError)) return 'internal';
  if (error.kind === 'unavailable') return 'scoresaber_unavailable';

  return error.kind;
};

type Dependencies = {
  /** Where the details of a failed sync go. The player only gets a code. */
  logError?: (message: string, error: unknown) => void;
  /**
   * A player is not fetched again within this time after a sync. ScoreSaber
   * caches score lists for 30 seconds anyway, and without the pause anyone
   * could make this server send it requests in a loop.
   */
  minSyncIntervalMs?: number;
  now?: () => Date;
  queue: Pick<JobQueue, 'enqueueSync'>;
  repository: PlayersRepository;
  scoreSaber: ScoreSaberClient;
};

/** The periodic job fetches players whose scores are older than this */
const STALE_AFTER_MS = 30 * 60 * 1000;
/** A sync marked as running for longer than this has died */
const STUCK_AFTER_MS = 15 * 60 * 1000;
/**
 * ScoreSaber caches score lists for 30 seconds. A score seen on the live
 * feed is therefore fetched a little later, when the list is sure to have it.
 */
const LIVE_SCORE_DELAY_SECONDS = 40;

const createPlayersService = ({
  logError = (message, error) => console.error(message, error),
  minSyncIntervalMs = 60_000,
  now = () => new Date(),
  queue,
  repository,
  scoreSaber,
}: Dependencies) => {
  /**
   * The stored player. If we do not know them yet, their profile is fetched
   * from ScoreSaber first; an id ScoreSaber does not know throws.
   */
  const ensureProfile = async (playerId: string) => {
    const known = await repository.findPlayer(playerId);

    if (known !== undefined) return known;

    const profile = await scoreSaber.getPlayer(playerId);

    return repository.savePlayer(toPlayerRow(profile, now()));
  };

  /**
   * Asks for the player's scores to be brought up to date in the background.
   * Returns at once.
   */
  const requestSync = async (
    playerId: string,
    {
      delaySeconds,
      force = false,
      priority = 'user',
    }: {
      delaySeconds?: number;
      /** Fetch even if the player was synced a moment ago */
      force?: boolean;
      priority?: SyncPriority;
    } = {}
  ): Promise<SyncRequest> => {
    const player = await ensureProfile(playerId);
    const lastSyncedAt = player.scoresSyncedAt;
    const time = now();

    if (
      !force &&
      lastSyncedAt !== null &&
      time.getTime() - lastSyncedAt.getTime() < minSyncIntervalMs
    )
      return { queued: false };

    // Visible to the frontend from this moment on, not only once a worker
    // gets to the job
    if (player.syncStartedAt === null)
      await repository.markSyncStarted(playerId, time);

    await queue.enqueueSync({ playerId }, { delaySeconds, priority });

    return { queued: true };
  };

  /**
   * Fetches the player's profile and new scores. This is the job itself; it
   * runs in a worker, not in a request.
   */
  const runSync = async (playerId: string): Promise<SyncResult> => {
    const startedAt = now();

    try {
      const profile = await scoreSaber.getPlayer(playerId);
      const player = await repository.savePlayer(
        toPlayerRow(profile, startedAt)
      );

      await repository.markSyncStarted(playerId, startedAt);

      // Until the first sync has finished, everything found is history and
      // is not logged. After that, every new or improved score is an event.
      const firstSync = player.scoresSyncedAt === null;
      // Continue where the stored scores end. On the very first run there is
      // nothing stored and all scores are fetched.
      const from = await repository.findNewestScoreDate(playerId);

      let added = 0;
      let improved = 0;

      for await (const page of scoreSaber.getScorePages(playerId, { from })) {
        const saved = await repository.saveScores(
          playerId,
          page.data.map(toLeaderboardRow),
          page.data.map((entry) => toScoreRow(playerId, entry)),
          { logEvents: !firstSync }
        );

        added += saved.added;
        improved += saved.improved;
      }

      await repository.markSyncFinished(playerId, startedAt);

      return { firstSync, added, improved };
    } catch (error) {
      // The details go to the log, the player gets a code, and the queue
      // sees the error too, so it tries the job again
      logError(`Sync of player ${playerId} failed`, error);
      await repository.markSyncFinished(
        playerId,
        startedAt,
        syncErrorCode(error)
      );

      throw error;
    }
  };

  /**
   * The safety net, run every few minutes: queues a sync for every tracked
   * player whose scores are old. It catches what the live feed missed while
   * it was down, and restarts syncs that died halfway.
   */
  const syncStalePlayers = async () => {
    const playerIds = await repository.listStalePlayerIds(now(), {
      staleAfterMs: STALE_AFTER_MS,
      stuckAfterMs: STUCK_AFTER_MS,
    });

    for (const playerId of playerIds)
      await requestSync(playerId, { force: true, priority: 'catchUp' });

    return playerIds.length;
  };

  /**
   * Called for every score on ScoreSaber's live feed. Almost all of them are
   * from players nobody here follows; those are dropped at once.
   */
  const handleLiveScore = async (playerId: string) => {
    if (!(await repository.isTracked(playerId))) return false;

    await requestSync(playerId, {
      force: true,
      delaySeconds: LIVE_SCORE_DELAY_SECONDS,
      priority: 'live',
    });

    return true;
  };

  return {
    ensureProfile,
    handleLiveScore,
    listScores: repository.listScores,
    requestSync,
    runSync,
    searchPlayers: scoreSaber.searchPlayers,
    syncStalePlayers,
  };
};

type PlayersService = ReturnType<typeof createPlayersService>;

export { createPlayersService };
export type { PlayersService, SyncErrorCode, SyncRequest, SyncResult };
