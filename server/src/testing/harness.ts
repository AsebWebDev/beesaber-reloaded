import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach } from 'vitest';

import { createApp } from '../app.ts';
import { user as users } from '../db/authSchema.ts';
import { createScoreSaberClient } from '../scoresaber/client.ts';
import { createTestDatabase } from './database.ts';
import { createFakeScoreSaber, FAKE_SCORESABER_URL } from './fakeScoreSaber.ts';

import type { Auth } from '../auth/auth.ts';

/**
 * What a test file gets by importing this: an empty database before every
 * test, a fake ScoreSaber, a signed-in test user, and the app wired to all of
 * them. Tests call `api(...)`, no server is started and no port is opened.
 */

/** The ScoreSaber id tests use for "my" profile */
const ME = '76561198000000001';

const USER_HEADER = 'x-test-user';

const database = createTestDatabase();
const scoreSaber = createFakeScoreSaber();

/**
 * Sign-in for tests: whoever sends the header is that user. The user is read
 * from the database on every request, like a real session would be.
 */
const fakeAuth: Auth = {
  handler: () => Promise.resolve(new Response(null, { status: 404 })),
  getUser: async (headers) => {
    const id = headers.get(USER_HEADER);

    if (id === null) return null;

    const [found] = await database.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (found === undefined) return null;

    const { email, image, name, playerId } = found;

    return { id, email, name, image, playerId };
  },
};

const app = createApp({
  auth: fakeAuth,
  db: database.db,
  // The client talks to the fake instead of the network, so no test can
  // reach the real ScoreSaber by accident
  scoreSaber: createScoreSaberClient({
    baseUrl: FAKE_SCORESABER_URL,
    fetch: scoreSaber.fetch,
  }),
});

/** Creates an account and returns a function that makes requests as it */
const createUser = async (id: string) => {
  await database.db
    .insert(users)
    .values({ id, name: id, email: `${id}@example.test` });

  return (path: string, init: RequestInit = {}) =>
    app.request(path, {
      ...init,
      headers: { ...init.headers, [USER_HEADER]: id },
    });
};

type Api = Awaited<ReturnType<typeof createUser>>;

/** Requests as the default test user, who exists in every test */
let api: Api;

/** Picks the ScoreSaber profile the user compares as */
const linkProfile = (playerId: string, as: Api = api) =>
  as('/api/me/player', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });

beforeEach(async () => {
  await database.reset();
  api = await createUser('test-user');
});

afterEach(() => {
  scoreSaber.reset();
});

afterAll(async () => {
  await database.close();
});

export { api, app, createUser, database, linkProfile, ME, scoreSaber };
export type { Api };
