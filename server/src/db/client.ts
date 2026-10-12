import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as authSchema from './authSchema.ts';
import * as appSchema from './schema.ts';

const schema = { ...appSchema, ...authSchema };

/**
 * Opens a connection pool and wraps it with Drizzle.
 *
 * Returns `close` as well, so a script or a test can end the pool and let the
 * process exit.
 */
const createDatabase = (url: string) => {
  const connection = postgres(url, {
    // Postgres sends notices for harmless things like "table already exists"
    onnotice: () => {},
  });
  const db = drizzle(connection, { schema, casing: 'snake_case' });

  return { db, close: () => connection.end() };
};

type Database = ReturnType<typeof createDatabase>['db'];

export { createDatabase };
export type { Database };
