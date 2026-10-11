import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * The database schema. Column names are written in camelCase here and stored
 * in snake_case (see `casing` in db/client.ts and drizzle.config.ts).
 *
 * After changing this file, run `pnpm db:generate` to create a migration and
 * `pnpm db:migrate` to apply it.
 */

const timestamptz = () => timestamp({ withTimezone: true, mode: 'date' });

/** A ScoreSaber player. Stored once, no matter how many hives contain them. */
const players = pgTable('players', {
  // The ScoreSaber id: a Steam id or an Oculus id, both too long for a number
  id: text().primaryKey(),
  name: text().notNull(),
  country: text().notNull(),
  avatarUrl: text().notNull(),
  rank: integer().notNull(),
  countryRank: integer().notNull(),
  totalPp: doublePrecision().notNull(),
  // How many leaderboards the player has a score on
  totalPlayed: integer().notNull(),
  inactive: boolean().notNull(),
  profileSyncedAt: timestamptz().notNull(),
  // Null until the scores have been fetched completely once
  scoresSyncedAt: timestamptz(),
});

/** One difficulty of one map. Scores are set on a leaderboard. */
const leaderboards = pgTable(
  'leaderboards',
  {
    id: integer().primaryKey(),
    mapHash: text().notNull(),
    songName: text().notNull(),
    songSubName: text().notNull(),
    songAuthorName: text().notNull(),
    levelAuthorName: text().notNull(),
    coverUrl: text().notNull(),
    // 1 Easy, 3 Normal, 5 Hard, 7 Expert, 9 Expert+
    difficulty: integer().notNull(),
    gameMode: text().notNull(),
    maxScore: integer().notNull(),
    stars: doublePrecision().notNull(),
    // RANKED, UNRANKED, QUALIFIED, LOVED
    status: text().notNull(),
  },
  (table) => [index().on(table.mapHash)]
);

/** The best score of a player on a leaderboard. */
const scores = pgTable(
  'scores',
  {
    playerId: text()
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    leaderboardId: integer()
      .notNull()
      .references(() => leaderboards.id),
    // ScoreSaber's id of this score. It changes when the player improves.
    scoreSaberId: integer().notNull(),
    modifiedScore: integer().notNull(),
    unmodifiedScore: integer().notNull(),
    // 0 to 1
    accuracy: doublePrecision().notNull(),
    pp: doublePrecision().notNull(),
    rank: integer().notNull(),
    mods: text().array().notNull(),
    fullCombo: boolean().notNull(),
    missedNotes: integer().notNull(),
    badCuts: integer().notNull(),
    maxCombo: integer().notNull(),
    playedAt: timestamptz().notNull(),
  },
  (table) => [
    // A player has exactly one row per leaderboard
    primaryKey({ columns: [table.playerId, table.leaderboardId] }),
    // "Latest scores of a player" reads along this index
    index().on(table.playerId, table.playedAt.desc()),
    // "Who else played this leaderboard" reads along this one
    index().on(table.leaderboardId),
  ]
);

/**
 * A log of score changes, written while syncing: a first score on a
 * leaderboard, or an improvement. `scores` only knows the current state;
 * this table knows when it changed, which is what "a bee beat your score"
 * is derived from.
 */
const scoreEvents = pgTable(
  'score_events',
  {
    id: serial().primaryKey(),
    playerId: text()
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    leaderboardId: integer()
      .notNull()
      .references(() => leaderboards.id),
    // Null for the first score of the player on this leaderboard
    previousScore: integer(),
    newScore: integer().notNull(),
    playedAt: timestamptz().notNull(),
    // False for scores found during the very first sync of a player. Those
    // are history, not news.
    isNews: boolean().notNull(),
  },
  (table) => [
    index().on(table.playerId, table.playedAt.desc()),
    index().on(table.leaderboardId),
  ]
);

/** `owner` has `member` in their hive. */
const hiveMembers = pgTable(
  'hive_members',
  {
    ownerId: text()
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    memberId: text()
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.memberId] }),
    check('not_self', sql`${table.ownerId} <> ${table.memberId}`),
  ]
);

export { hiveMembers, leaderboards, players, scoreEvents, scores };
