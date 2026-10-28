import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  lt,
  max,
  or,
  sql,
} from 'drizzle-orm';

import { user as users } from '../db/authSchema.ts';
import {
  hiveMembers,
  leaderboards,
  players,
  scoreEvents,
  scores,
} from '../db/schema.ts';

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

  /** Inserts the player or refreshes the profile. Keeps the sync columns. */
  const savePlayer = async (row: PlayerRow) => {
    const [player] = await db
      .insert(players)
      .values(row)
      // `row` has no sync columns, so those keep their values
      .onConflictDoUpdate({ target: players.id, set: row })
      .returning();

    // An insert with RETURNING always yields the row
    return player!;
  };

  /** A sync of the player is queued or running since `at` */
  const markSyncStarted = (playerId: string, at: Date) =>
    db
      .update(players)
      .set({ syncStartedAt: at })
      .where(eq(players.id, playerId));

  /**
   * The sync is over. Without an error, the scores are up to date as of
   * `at`. With one, the failure is counted, which makes the periodic sync
   * wait longer before the next attempt.
   */
  const markSyncFinished = (playerId: string, at: Date, error?: string) =>
    db
      .update(players)
      .set(
        error === undefined
          ? {
              syncStartedAt: null,
              syncError: null,
              syncFailures: 0,
              syncFailedAt: null,
              scoresSyncedAt: at,
            }
          : {
              syncStartedAt: null,
              syncError: error,
              syncFailures: sql`${players.syncFailures} + 1`,
              syncFailedAt: at,
            }
      )
      .where(eq(players.id, playerId));

  // A player is "tracked" when somebody cares about their scores: they are
  // in a hive, or an account compares as them.
  const tracked = or(
    inArray(
      players.id,
      db.select({ id: hiveMembers.memberId }).from(hiveMembers)
    ),
    inArray(
      players.id,
      db
        .select({ id: sql<string>`${users.playerId}` })
        .from(users)
        .where(sql`${users.playerId} is not null`)
    )
  );

  const isTracked = async (playerId: string) => {
    const [row] = await db
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.id, playerId), tracked));

    return row !== undefined;
  };

  /**
   * Tracked players that are due for a sync at `now`:
   * - never fetched, or last fetched more than `staleAfterMs` ago
   * - or marked as syncing for more than `stuckAfterMs`, which means the
   *   sync died
   *
   * A player whose last attempts failed is held back: half an hour after the
   * first failure, an hour after the second, doubling up to a day. A player
   * who was banned or deleted on ScoreSaber is then asked for once a day
   * instead of three times every quarter of an hour.
   */
  const listStalePlayerIds = async (
    now: Date,
    {
      staleAfterMs,
      stuckAfterMs,
    }: { staleAfterMs: number; stuckAfterMs: number }
  ) => {
    const time = now.getTime();
    const syncedBefore = new Date(time - staleAfterMs);
    const stuckBefore = new Date(time - stuckAfterMs);
    const waitedLongEnough = or(
      eq(players.syncFailures, 0),
      sql`${players.syncFailedAt} < ${now.toISOString()}::timestamptz - least(power(2, ${players.syncFailures} - 1), 48) * interval '30 minutes'`
    );

    const rows = await db
      .select({ id: players.id })
      .from(players)
      .where(
        and(
          tracked,
          or(
            and(
              isNull(players.syncStartedAt),
              or(
                isNull(players.scoresSyncedAt),
                lt(players.scoresSyncedAt, syncedBefore)
              ),
              waitedLongEnough
            ),
            lt(players.syncStartedAt, stuckBefore)
          )
        )
      );

    return rows.map((row) => row.id);
  };

  /** When the newest stored score of the player was set */
  const findNewestScoreDate = async (playerId: string) => {
    const [row] = await db
      .select({ newest: max(scores.playedAt) })
      .from(scores)
      .where(eq(scores.playerId, playerId));

    return row?.newest ?? undefined;
  };

  /**
   * Stores one page of a player's scores and, if asked to, logs what changed.
   *
   * Runs in a transaction: either the leaderboards, the scores and the events
   * of the page are all stored, or none of them. A crash in the middle cannot
   * leave a score without its event.
   */
  const saveScores = (
    playerId: string,
    leaderboardRows: LeaderboardRow[],
    scoreRows: ScoreRow[],
    { logEvents }: { logEvents: boolean }
  ) =>
    db.transaction(async (tx) => {
      // One row per leaderboard, the best one. We expect ScoreSaber to send
      // just that, but an upsert fails if a statement touches a row twice.
      const best = new Map<number, ScoreRow>();

      for (const row of scoreRows) {
        const known = best.get(row.leaderboardId);

        if (known === undefined || row.modifiedScore > known.modifiedScore)
          best.set(row.leaderboardId, row);
      }

      const rows = [...best.values()];

      if (rows.length === 0) return { added: 0, improved: 0 };

      // Two syncs of the same player must not interleave here. Both would
      // read the same stored score: the same event would be logged twice
      // (the unique index on events catches that), and when they bring
      // different improvements, the later event would name the wrong
      // previous score (nothing else catches that, and news depends on
      // it). The lock is per player and is released when the transaction
      // ends.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`player:${playerId}`}))`
      );

      await tx
        .insert(leaderboards)
        .values([
          ...new Map(leaderboardRows.map((row) => [row.id, row])).values(),
        ])
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
              rows.map((row) => row.leaderboardId)
            )
          )
        );
      const previousScores = new Map(
        existing.map((row) => [row.leaderboardId, row.modifiedScore])
      );

      const changes = rows.flatMap((row) => {
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
          },
        ];
      });

      await tx
        .insert(scores)
        .values(rows)
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
          // We keep a player's best score. Whatever arrives, a stored score
          // is never replaced by a worse one.
          setWhere: sql`excluded.modified_score >= ${scores.modifiedScore}`,
        });

      if (logEvents && changes.length > 0)
        await tx.insert(scoreEvents).values(changes).onConflictDoNothing();

      return {
        added: changes.filter((change) => change.previousScore === null).length,
        improved: changes.filter((change) => change.previousScore !== null)
          .length,
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
    isTracked,
    listScores,
    listStalePlayerIds,
    markSyncFinished,
    markSyncStarted,
    savePlayer,
    saveScores,
  };
};

type PlayersRepository = ReturnType<typeof createPlayersRepository>;

export { createPlayersRepository };
export type { ListScoresOptions, PlayersRepository, ScoreSort };
