import { and, asc, desc, eq, gt, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import {
  hiveMembers,
  leaderboards,
  players,
  scoreEvents,
  scores,
} from '../db/schema.ts';

import type { Database } from '../db/client.ts';
import type { Me } from '../http/session.ts';

/**
 * Reads and writes hives, and answers the questions a hive is for: how do I
 * compare to a bee, and which of my scores did a bee beat.
 *
 * A hive belongs to a user account (`me.userId`). "My scores" are those of
 * the ScoreSaber profile the account compares as (`me.playerId`).
 *
 * The comparisons join the `scores` table with itself: once for my scores
 * ("mine") and once for the bee's ("theirs"), matched by leaderboard.
 */

/** Which of the leaderboards both players have a score on */
type ComparisonFilter = 'all' | 'losing' | 'winning';

type ComparisonOptions = {
  filter: ComparisonFilter;
  limit: number;
  page: number;
};

const mine = alias(scores, 'mine');
const theirs = alias(scores, 'theirs');

const count = (condition?: ReturnType<typeof sql>) =>
  (condition === undefined
    ? sql<number>`count(*)`
    : sql<number>`count(*) filter (where ${condition})`
  ).mapWith(Number);

const createHiveRepository = (db: Database) => {
  const isMember = async (userId: string, memberId: string) => {
    const [row] = await db
      .select({ memberId: hiveMembers.memberId })
      .from(hiveMembers)
      .where(
        and(eq(hiveMembers.userId, userId), eq(hiveMembers.memberId, memberId))
      );

    return row !== undefined;
  };

  const countMembers = async (userId: string) => {
    const [row] = await db
      .select({ total: count() })
      .from(hiveMembers)
      .where(eq(hiveMembers.userId, userId));

    return row?.total ?? 0;
  };

  /** Adding a player twice is not an error, the second call changes nothing */
  const addMember = (userId: string, memberId: string) =>
    db.insert(hiveMembers).values({ userId, memberId }).onConflictDoNothing();

  /** Returns whether there was a member to remove */
  const removeMember = async (userId: string, memberId: string) => {
    const removed = await db
      .delete(hiveMembers)
      .where(
        and(eq(hiveMembers.userId, userId), eq(hiveMembers.memberId, memberId))
      )
      .returning({ memberId: hiveMembers.memberId });

    return removed.length > 0;
  };

  /**
   * The bees of a hive, each with my head-to-head record against them: on how
   * many shared leaderboards I am ahead, behind, or level.
   */
  const listMembers = ({ playerId, userId }: Me) =>
    db
      .select({
        player: players,
        addedAt: hiveMembers.createdAt,
        shared: count(sql`${mine.leaderboardId} is not null`),
        winning: count(sql`${mine.modifiedScore} > ${theirs.modifiedScore}`),
        losing: count(sql`${mine.modifiedScore} < ${theirs.modifiedScore}`),
      })
      .from(hiveMembers)
      .innerJoin(players, eq(players.id, hiveMembers.memberId))
      // Left joins, so a bee without scores still shows up, with zeros
      .leftJoin(theirs, eq(theirs.playerId, hiveMembers.memberId))
      .leftJoin(
        mine,
        and(
          eq(mine.playerId, playerId),
          eq(mine.leaderboardId, theirs.leaderboardId)
        )
      )
      .where(eq(hiveMembers.userId, userId))
      .groupBy(players.id, hiveMembers.createdAt)
      .orderBy(asc(hiveMembers.createdAt));

  /** The leaderboards both players have a score on, with both scores */
  const compare = async (
    myPlayerId: string,
    memberId: string,
    { filter, limit, page }: ComparisonOptions
  ) => {
    const where = and(
      eq(mine.playerId, myPlayerId),
      filter === 'winning'
        ? gt(mine.modifiedScore, theirs.modifiedScore)
        : filter === 'losing'
          ? lt(mine.modifiedScore, theirs.modifiedScore)
          : undefined
    );
    const bothPlayed = and(
      eq(theirs.leaderboardId, mine.leaderboardId),
      eq(theirs.playerId, memberId)
    );

    const [items, [total]] = await Promise.all([
      db
        .select({ leaderboard: leaderboards, mine, theirs })
        .from(mine)
        .innerJoin(theirs, bothPlayed)
        .innerJoin(leaderboards, eq(leaderboards.id, mine.leaderboardId))
        .where(where)
        // Whatever either of the two played last comes first
        .orderBy(
          desc(sql`greatest(${mine.playedAt}, ${theirs.playedAt})`),
          asc(mine.leaderboardId)
        )
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(mine)
        .innerJoin(theirs, bothPlayed)
        .where(where),
    ]);

    return { items, total: total?.total ?? 0 };
  };

  /**
   * "A bee beat your score": score changes of bees that went past my score
   * and that I have not answered yet.
   */
  const listNews = ({ playerId, userId }: Me, limit: number) =>
    db
      .select({
        event: scoreEvents,
        player: {
          id: players.id,
          name: players.name,
          avatarUrl: players.avatarUrl,
        },
        leaderboard: leaderboards,
        myScore: mine.modifiedScore,
      })
      .from(scoreEvents)
      .innerJoin(
        hiveMembers,
        and(
          eq(hiveMembers.memberId, scoreEvents.playerId),
          eq(hiveMembers.userId, userId)
        )
      )
      .innerJoin(
        mine,
        and(
          eq(mine.playerId, playerId),
          eq(mine.leaderboardId, scoreEvents.leaderboardId)
        )
      )
      .innerJoin(players, eq(players.id, scoreEvents.playerId))
      .innerJoin(leaderboards, eq(leaderboards.id, scoreEvents.leaderboardId))
      .where(
        and(
          eq(scoreEvents.isNews, true),
          // The bee is ahead of me now ...
          gt(scoreEvents.newScore, mine.modifiedScore),
          // ... and was not ahead before this score
          or(
            isNull(scoreEvents.previousScore),
            lte(scoreEvents.previousScore, mine.modifiedScore)
          )
        )
      )
      .orderBy(desc(scoreEvents.playedAt), desc(scoreEvents.id))
      .limit(limit);

  return {
    addMember,
    compare,
    countMembers,
    isMember,
    listMembers,
    listNews,
    removeMember,
  };
};

type HiveRepository = ReturnType<typeof createHiveRepository>;

export { createHiveRepository };
export type { ComparisonFilter, ComparisonOptions, HiveRepository };
