import { sql } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { TEST_DATABASE_URL } from '../testing/database.ts';
import { createDatabase } from './client.ts';

describe('createDatabase', () => {
  it('signs in with the password function when the URL has no password', async () => {
    const url = new URL(TEST_DATABASE_URL);
    const secret = url.password;
    const password = vi.fn(() => Promise.resolve(secret));

    url.password = '';

    const { db, close } = createDatabase(url.toString(), { password });

    try {
      expect(await db.execute(sql`select 1 as one`)).toEqual([{ one: 1 }]);
      expect(password).toHaveBeenCalled();
    } finally {
      await close();
    }
  });
});
