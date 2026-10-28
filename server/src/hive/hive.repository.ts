import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
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

type RevengeOptions = {
  limit: number;
  /** Only this bee, or all of them */
  member?: string | undefined;
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

  /**
   * Adds a player to the hive unless that would exceed `maxSize`. Adding a
   * player who is already in is not an error and changes nothing.
   *
   * Counting and inserting happen under a lock per user. Without it, two
   * requests at the same moment could both count 49 and both insert.
   */
  const addMember = (userId: string, memberId: string, maxSize: number) =>
    db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`hive:${userId}`}))`
      );

      const members = await tx
        .select({ memberId: hiveMembers.memberId })
        .from(hiveMembers)
        .where(eq(hiveMembers.userId, userId));

      if (members.some((member) => member.memberId === memberId))
        return 'exists' as const;
      if (members.length >= maxSize) return 'full' as const;

      await tx.insert(hiveMembers).values({ userId, memberId });

      return 'added' as const;
    });

  /** Just the ids of the bees, without the head-to-head records */
  const listMemberIds = async (userId: string) => {
    const rows = await db
      .select({ memberId: hiveMembers.memberId })
      .from(hiveMembers)
      .where(eq(hiveMembers.userId, userId))
      .orderBy(asc(hiveMembers.createdAt));

    return rows.map((row) => row.memberId);
  };

  /**
   * Whose scores are being fetched right now, out of me and my bees. Small
   * and cheap on purpose: the frontend asks this over and over while it
   * waits, instead of asking for the whole hive.
   */
  const listSyncing = ({ playerId, userId }: Me) =>
    db
      .select({ playerId: players.id, since: players.syncStartedAt })
      .from(players)
      .where(
        and(
          isNotNull(players.syncStartedAt),
          or(
            eq(players.id, playerId),
            inArray(
              players.id,
              db
                .select({ memberId: hiveMembers.memberId })
                .from(hiveMembers)
                .where(eq(hiveMembers.userId, userId))
            )
          )
        )
      )
      .orderBy(asc(players.id));

  /**
   * One map, and how I and my bees stand on it: everyone of us who played
   * it, best score first. Players with the same score share a place.
   * Nothing when the map is unknown here, because nobody tracked has
   * played it.
   */
  const mapRanking = async (
    { playerId, userId }: Me,
    leaderboardId: number
  ) => {
    const [leaderboard] = await db
      .select()
      .from(leaderboards)
      .where(eq(leaderboards.id, leaderboardId));

    if (leaderboard === undefined) return undefined;

    const entries = await db
      .select({
        place:
          sql<number>`rank() over (order by ${scores.modifiedScore} desc)`.mapWith(
            Number
          ),
        isMe: sql<boolean>`${scores.playerId} = ${playerId}`,
        player: {
          id: players.id,
          name: players.name,
          avatarUrl: players.avatarUrl,
          country: players.country,
        },
        score: {
          modifiedScore: scores.modifiedScore,
          accuracy: scores.accuracy,
          fullCombo: scores.fullCombo,
          playedAt: scores.playedAt,
        },
      })
      .from(scores)
      .innerJoin(players, eq(players.id, scores.playerId))
      .where(
        and(
          eq(scores.leaderboardId, leaderboardId),
          or(
            eq(scores.playerId, playerId),
            inArray(
              scores.playerId,
              db
                .select({ memberId: hiveMembers.memberId })
                .from(hiveMembers)
                .where(eq(hiveMembers.userId, userId))
            )
          )
        )
      )
      // On a tie, whoever got there first is listed first
      .orderBy(desc(scores.modifiedScore), asc(scores.playedAt));

    return { leaderboard, entries };
  };

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
   * The revenge list: every map where a bee is ahead of me, the closest
   * first. How close is measured in accuracy points, the share of the
   * map's maximum score between the two scores, since that is what a
   * player can aim for: "0.3 % more and you are ahead". Maps without a
   * maximum score, which ScoreSaber leaves out for some unranked ones,
   * have no such share; they come last, closest in points first.
   */
  const revenge = async (
    { playerId, userId }: Me,
    { limit, member, page }: RevengeOptions
  ) => {
    const gap = sql<number>`${theirs.modifiedScore} - ${mine.modifiedScore}`;
    const gapShare = sql<
      number | null
    >`case when ${leaderboards.maxScore} > 0 then (${theirs.modifiedScore} - ${mine.modifiedScore})::float8 / ${leaderboards.maxScore} end`;
    const where = and(
      eq(hiveMembers.userId, userId),
      member === undefined ? undefined : eq(hiveMembers.memberId, member),
      gt(theirs.modifiedScore, mine.modifiedScore)
    );

    const [items, [total]] = await Promise.all([
      db
        .select({
          leaderboard: leaderboards,
          bee: {
            id: players.id,
            name: players.name,
            avatarUrl: players.avatarUrl,
          },
          myScore: mine.modifiedScore,
          theirScore: theirs.modifiedScore,
          gap: gap.mapWith(Number),
          gapShare,
        })
        .from(hiveMembers)
        .innerJoin(theirs, eq(theirs.playerId, hiveMembers.memberId))
        .innerJoin(
          mine,
          and(
            eq(mine.playerId, playerId),
            eq(mine.leaderboardId, theirs.leaderboardId)
          )
        )
        .innerJoin(leaderboards, eq(leaderboards.id, theirs.leaderboardId))
        .innerJoin(players, eq(players.id, hiveMembers.memberId))
        .where(where)
        .orderBy(
          sql`${gapShare} asc nulls last`,
          asc(gap),
          asc(leaderboards.id),
          asc(players.id)
        )
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(hiveMembers)
        .innerJoin(theirs, eq(theirs.playerId, hiveMembers.memberId))
        .innerJoin(
          mine,
          and(
            eq(mine.playerId, playerId),
            eq(mine.leaderboardId, theirs.leaderboardId)
          )
        )
        .where(where),
    ]);

    return { items, total: total?.total ?? 0 };
  };

  /**
   * "A bee beat your score": score changes of bees that went past my score
   * and that I have not answered yet.
   *
   * Only what happened after the bee joined my hive counts. A bee may have
   * been tracked for years by someone else; none of that is news to me.
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
        // What the bee holds now, which can be more than the score of the
        // event if they improved again since
        theirScore: theirs.modifiedScore,
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
      .innerJoin(
        theirs,
        and(
          eq(theirs.playerId, scoreEvents.playerId),
          eq(theirs.leaderboardId, scoreEvents.leaderboardId)
        )
      )
      .innerJoin(players, eq(players.id, scoreEvents.playerId))
      .innerJoin(leaderboards, eq(leaderboards.id, scoreEvents.leaderboardId))
      .where(
        and(
          gt(scoreEvents.playedAt, hiveMembers.createdAt),
          // This score took the bee past me ...
          gt(scoreEvents.newScore, mine.modifiedScore),
          or(
            isNull(scoreEvents.previousScore),
            lte(scoreEvents.previousScore, mine.modifiedScore)
          ),
          // ... and the bee is still ahead
          gt(theirs.modifiedScore, mine.modifiedScore)
        )
      )
      .orderBy(desc(scoreEvents.playedAt), desc(scoreEvents.id))
      .limit(limit);

  return {
    addMember,
    compare,
    isMember,
    listMemberIds,
    listMembers,
    listNews,
    listSyncing,
    mapRanking,
    removeMember,
    revenge,
  };
};

type HiveRepository = ReturnType<typeof createHiveRepository>;

export { createHiveRepository };
export type {
  ComparisonFilter,
  ComparisonOptions,
  HiveRepository,
  RevengeOptions,
};
