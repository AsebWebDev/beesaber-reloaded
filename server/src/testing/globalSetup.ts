import { runMigrations } from '../db/migrate.ts';
import { TEST_DATABASE_URL } from './database.ts';

// Runs once before the whole test run
export default async function setup() {
  try {
    await runMigrations(TEST_DATABASE_URL);
  } catch (cause) {
    throw new Error(
      'Could not prepare the test database. Is it running? Start it with `docker compose up -d`.',
      { cause }
    );
  }
}
