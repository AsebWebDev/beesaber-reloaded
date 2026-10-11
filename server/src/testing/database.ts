import { sql } from 'drizzle-orm';

import { createDatabase } from '../db/client.ts';

/**
 * The database the tests run against: a real Postgres, in a database of its
 * own next to the development one (see docker-compose.yml).
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://beesaber:beesaber@localhost:5432/beesaber_test';

const createTestDatabase = () => {
  const { db, close } = createDatabase(TEST_DATABASE_URL);

  /** Empties every table, so each test starts from nothing */
  const reset = () =>
    db.execute(
      sql`truncate table hive_members, score_events, scores, leaderboards, players restart identity cascade`
    );

  return { db, close, reset };
};

export { createTestDatabase, TEST_DATABASE_URL };
