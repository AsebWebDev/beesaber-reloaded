import {
  toLeaderboardRow,
  toPlayerRow,
  toScoreRow,
} from '../scoresaber/mapping.ts';

import type { ScoreSaberClient } from '../scoresaber/client.ts';
import type { PlayersRepository } from './players.repository.ts';

/**
 * What the app does with players: look them up on ScoreSaber and copy their
 * profile and scores into our database. Knows the steps, but neither HTTP
 * nor SQL.
 */

type SyncResult = {
  /** Scores on leaderboards the player had no score on before */
  added: number;
  /** True when this was the first complete fetch of the player's scores */
  firstSync: boolean;
  /** Scores that beat the player's own previous score */
  improved: number;
  playerId: string;
  /** True when the last sync was so recent that nothing was fetched */
  skipped: boolean;
};

type Dependencies = {
  /**
   * A player is not fetched again within this time after a sync. ScoreSaber
   * caches score lists for 30 seconds anyway, and without the pause anyone
   * could make this server send it requests in a loop.
   */
  minSyncIntervalMs?: number;
  now?: () => Date;
  repository: PlayersRepository;
  scoreSaber: ScoreSaberClient;
};

const createPlayersService = ({
  minSyncIntervalMs = 60_000,
  now = () => new Date(),
  repository,
  scoreSaber,
}: Dependencies) => {
  // Syncs that are running right now, by player id
  const running = new Map<string, Promise<SyncResult>>();

  const runSync = async (playerId: string): Promise<SyncResult> => {
    const startedAt = now();
    const lastSyncedAt = (await repository.findPlayer(playerId))
      ?.scoresSyncedAt;

    if (
      lastSyncedAt != null &&
      startedAt.getTime() - lastSyncedAt.getTime() < minSyncIntervalMs
    )
      return {
        playerId,
        firstSync: false,
        added: 0,
        improved: 0,
        skipped: true,
      };

    const profile = await scoreSaber.getPlayer(playerId);
    const player = await repository.savePlayer(toPlayerRow(profile, startedAt));

    // Until the first sync has finished, everything found is history. After
    // that, every new or improved score is news.
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
        { isNews: !firstSync }
      );

      added += saved.added;
      improved += saved.improved;
    }

    await repository.markScoresSynced(playerId, startedAt);

    return { playerId, firstSync, added, improved, skipped: false };
  };

  /**
   * Brings a player's profile and scores up to date.
   *
   * Two calls for the same player at the same time share one run instead of
   * fetching everything twice.
   */
  const syncPlayer = (playerId: string): Promise<SyncResult> => {
    const alreadyRunning = running.get(playerId);

    if (alreadyRunning !== undefined) return alreadyRunning;

    const sync = runSync(playerId).finally(() => running.delete(playerId));

    running.set(playerId, sync);

    return sync;
  };

  /** The stored player, fetched from ScoreSaber first if we do not know them */
  const getOrSyncPlayer = async (playerId: string) => {
    const known = await repository.findPlayer(playerId);

    if (known !== undefined) return known;

    await syncPlayer(playerId);

    // syncPlayer has just stored the player
    return (await repository.findPlayer(playerId))!;
  };

  return {
    getOrSyncPlayer,
    listScores: repository.listScores,
    searchPlayers: scoreSaber.searchPlayers,
    syncPlayer,
  };
};

type PlayersService = ReturnType<typeof createPlayersService>;

export { createPlayersService };
export type { PlayersService, SyncResult };
