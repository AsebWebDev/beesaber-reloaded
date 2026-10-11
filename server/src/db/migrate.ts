import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../config.ts';
import { createDatabase } from './client.ts';

import type { Database } from './client.ts';

const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url)
);

/**
 * Applies every migration that the database has not seen yet. Drizzle keeps
 * track of them in a table of its own, so running this twice is harmless.
 */
const runMigrations = (db: Database) => migrate(db, { migrationsFolder });

// Only when started directly (`pnpm db:migrate`), not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { db, close } = createDatabase(loadConfig().DATABASE_URL);

  await runMigrations(db);
  await close();
  console.log('Migrations applied');
}

export { runMigrations };
