import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { TEST_DATABASE_URL } from '../testing/database.ts';
import { createDatabase } from './client.ts';
import { runMigrations } from './migrate.ts';

// An empty database of its own: the test database already has every
// migration applied, so nothing would be left to run there
const EMPTY = 'beesaber_migrate_test';
const emptyUrl = (() => {
  const url = new URL(TEST_DATABASE_URL);

  url.pathname = `/${EMPTY}`;

  return url.toString();
})();

const admin = createDatabase(TEST_DATABASE_URL);

beforeAll(async () => {
  await admin.db.execute(sql.raw(`drop database if exists ${EMPTY}`));
  await admin.db.execute(sql.raw(`create database ${EMPTY}`));
});

afterAll(async () => {
  await admin.db.execute(sql.raw(`drop database if exists ${EMPTY}`));
  await admin.close();
});

describe('runMigrations', () => {
  it('lets two processes that start at once both succeed, and applies each migration once', async () => {
    await Promise.all([runMigrations(emptyUrl), runMigrations(emptyUrl)]);

    const target = createDatabase(emptyUrl);

    try {
      const applied = await target.db.execute(
        sql`select count(*)::int as count from drizzle.__drizzle_migrations`
      );
      const tables = await target.db.execute(
        sql`select table_name from information_schema.tables where table_schema = 'public'`
      );

      expect(applied[0]).toEqual({ count: 4 });
      expect(tables.map(({ table_name }) => table_name)).toEqual(
        expect.arrayContaining(['user', 'players', 'scores', 'hive_members'])
      );
    } finally {
      await target.close();
    }
  });
});
