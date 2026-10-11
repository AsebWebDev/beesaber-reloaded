import { and, asc, desc, eq, ilike, inArray, max, or, sql } from 'drizzle-orm';

import { leaderboards, players, scoreEvents, scores } from '../db/schema.ts';

import type { Database } from '../db/client.ts';
import type {
  LeaderboardRow,
  PlayerRow,
  ScoreRow,
} from '../scoresaber/mapping.ts';

/**
 * Everything that reads or writes players and their scores. Functions here
 * know SQL and nothing about HTTP or ScoreSaber.
 */

type ScoreSort = 'recent' | 'top';

type ListScoresOptions = {
  limit: number;
  page: number;
  search?: string;
  sort: ScoreSort;
};

/** % and _ are wildcards in LIKE. Escaped, they match themselves. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

const createPlayersRepository = (db: Database) => {
  const findPlayer = async (id: string) => {
    const [player] = await db.select().from(players).where(eq(players.id, id));

    return player;
  };

  /** Inserts the player or refreshes the profile. Keeps `scoresSyncedAt`. */
  const savePlayer = async (row: PlayerRow) => {
    const [player] = await db
      .insert(players)
      .values(row)
      // `row` has no scoresSyncedAt, so that column keeps its value
      .onConflictDoUpdate({ target: players.id, set: row })
      .returning();

    // An insert with RETURNING always yields the row
    return player!;
  };

  const markScoresSynced = (playerId: string, at: Date) =>
    db
      .update(players)
      .set({ scoresSyncedAt: at })
      .where(eq(players.id, playerId));

  /** When the newest stored score of the player was set */
  const findNewestScoreDate = async (playerId: string) => {
    const [row] = await db
      .select({ newest: max(scores.playedAt) })
      .from(scores)
      .where(eq(scores.playerId, playerId));

    return row?.newest ?? undefined;
  };

  /**
   * Stores one page of a player's scores and logs what changed.
   *
   * Runs in a transaction: either the leaderboards, the scores and the events
   * of the page are all stored, or none of them. A crash in the middle cannot
   * leave a score without its event.
   */
  const saveScores = (
    playerId: string,
    leaderboardRows: LeaderboardRow[],
    scoreRows: ScoreRow[],
    { isNews }: { isNews: boolean }
  ) =>
    db.transaction(async (tx) => {
      if (scoreRows.length === 0) return { added: 0, improved: 0 };

      await tx
        .insert(leaderboards)
        .values(leaderboardRows)
        .onConflictDoUpdate({
          target: leaderboards.id,
          // "excluded" is the row that could not be inserted. Only these
          // fields change over the life of a leaderboard.
          set: {
            coverUrl: sql`excluded.cover_url`,
            maxScore: sql`excluded.max_score`,
            stars: sql`excluded.stars`,
            status: sql`excluded.status`,
          },
        });

      const existing = await tx
        .select({
          leaderboardId: scores.leaderboardId,
          modifiedScore: scores.modifiedScore,
        })
        .from(scores)
        .where(
          and(
            eq(scores.playerId, playerId),
            inArray(
              scores.leaderboardId,
              scoreRows.map((row) => row.leaderboardId)
            )
          )
        );
      const previousScores = new Map(
        existing.map((row) => [row.leaderboardId, row.modifiedScore])
      );

      const events = scoreRows.flatMap((row) => {
        const previousScore = previousScores.get(row.leaderboardId);

        // Same or lower score: nothing happened worth logging
        if (previousScore !== undefined && row.modifiedScore <= previousScore)
          return [];

        return [
          {
            playerId,
            leaderboardId: row.leaderboardId,
            previousScore: previousScore ?? null,
            newScore: row.modifiedScore,
            playedAt: row.playedAt,
            isNews,
          },
        ];
      });

      await tx
        .insert(scores)
        .values(scoreRows)
        .onConflictDoUpdate({
          target: [scores.playerId, scores.leaderboardId],
          set: {
            scoreSaberId: sql`excluded.score_saber_id`,
            modifiedScore: sql`excluded.modified_score`,
            unmodifiedScore: sql`excluded.unmodified_score`,
            accuracy: sql`excluded.accuracy`,
            pp: sql`excluded.pp`,
            rank: sql`excluded.rank`,
            mods: sql`excluded.mods`,
            fullCombo: sql`excluded.full_combo`,
            missedNotes: sql`excluded.missed_notes`,
            badCuts: sql`excluded.bad_cuts`,
            maxCombo: sql`excluded.max_combo`,
            playedAt: sql`excluded.played_at`,
          },
        });

      if (events.length > 0) await tx.insert(scoreEvents).values(events);

      return {
        added: events.filter((event) => event.previousScore === null).length,
        improved: events.filter((event) => event.previousScore !== null).length,
      };
    });

  /** A page of a player's scores, each with its leaderboard */
  const listScores = async (
    playerId: string,
    { limit, page, search, sort }: ListScoresOptions
  ) => {
    const pattern =
      search === undefined ? undefined : `%${escapeLike(search)}%`;
    const where = and(
      eq(scores.playerId, playerId),
      pattern === undefined
        ? undefined
        : or(
            ilike(leaderboards.songName, pattern),
            ilike(leaderboards.songAuthorName, pattern)
          )
    );

    const [items, [count]] = await Promise.all([
      db
        .select({ score: scores, leaderboard: leaderboards })
        .from(scores)
        .innerJoin(leaderboards, eq(leaderboards.id, scores.leaderboardId))
        .where(where)
        .orderBy(
          sort === 'top' ? desc(scores.modifiedScore) : desc(scores.playedAt),
          // A second criterion, so equal values always come in the same order
          asc(scores.leaderboardId)
        )
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: sql<number>`count(*)`.mapWith(Number) })
        .from(scores)
        .innerJoin(leaderboards, eq(leaderboards.id, scores.leaderboardId))
        .where(where),
    ]);

    return { items, total: count?.total ?? 0 };
  };

  return {
    findNewestScoreDate,
    findPlayer,
    listScores,
    markScoresSynced,
    savePlayer,
    saveScores,
  };
};

type PlayersRepository = ReturnType<typeof createPlayersRepository>;

export { createPlayersRepository };
export type { ListScoresOptions, PlayersRepository, ScoreSort };
