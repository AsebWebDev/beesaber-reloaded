import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../config.ts';
import { createDatabase } from './client.ts';

const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url)
);

/** Any fixed number will do, as long as nothing else locks with it */
const MIGRATION_LOCK = 4_242_001;

/**
 * Applies every migration that the database has not seen yet. Drizzle keeps
 * track of them in a table of its own, so running this twice is harmless.
 *
 * Two processes can start at the same moment, like the API and a scheduled
 * job, and would both apply the same migration. A lock in Postgres lets the
 * second one wait until the first is done; it then finds nothing left to do.
 * The lock belongs to a connection, so this opens one of its own: in a pool,
 * the next query may go out on another connection.
 */
const runMigrations = async (url: string) => {
  const { db, close } = createDatabase(url, { maxConnections: 1 });

  try {
    await db.execute(sql`select pg_advisory_lock(${MIGRATION_LOCK})`);
    await migrate(db, { migrationsFolder });
  } finally {
    // Ending the connection also releases the lock, even after a failure
    await close();
  }
};

// Only when started directly (`pnpm db:migrate`), not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runMigrations(loadConfig().DATABASE_URL);
  console.log('Migrations applied');
}

export { runMigrations };
