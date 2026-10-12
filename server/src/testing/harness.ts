import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach } from 'vitest';

import { createApp } from '../app.ts';
import { user as users } from '../db/authSchema.ts';
import { createInlineQueue } from '../jobs/queue.ts';
import { createScoreSaberClient } from '../scoresaber/client.ts';
import { createServices, startJobs } from '../services.ts';
import { createTestDatabase } from './database.ts';
import { createFakeScoreSaber, FAKE_SCORESABER_URL } from './fakeScoreSaber.ts';

import type { Auth } from '../auth/auth.ts';
import type { JobQueue, SyncJob } from '../jobs/queue.ts';

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
  methods: { devLogin: true, google: false },
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

const APP_URL = 'http://localhost:3000';

type TestAppOptions = {
  auth?: Auth;
  minSyncIntervalMs?: number;
  now?: () => Date;
  queue?: JobQueue;
  requestsPerMinute?: number;
};

/**
 * Builds the app for tests, with its services. A test can override single
 * settings.
 */
const createTestApp = ({
  auth = fakeAuth,
  // Tests sync the same player several times in a row
  minSyncIntervalMs = 0,
  now,
  // Jobs run at once, so a test sees their result right after the request
  queue = createInlineQueue(),
  // No test should run into the limit by accident
  requestsPerMinute = 10_000,
}: TestAppOptions = {}) => {
  const services = createServices({
    db: database.db,
    minSyncIntervalMs,
    now,
    queue,
    // The client talks to the fake instead of the network, so no test can
    // reach the real ScoreSaber by accident
    scoreSaber: createScoreSaberClient({
      baseUrl: FAKE_SCORESABER_URL,
      fetch: scoreSaber.fetch,
    }),
  });

  void startJobs(queue, services);

  return {
    app: createApp({
      appUrl: APP_URL,
      auth,
      db: database.db,
      requestsPerMinute,
      services,
    }),
    services,
  };
};

/**
 * A queue that only collects jobs. A test decides when they run, and can
 * look at what was queued in the meantime.
 */
const createManualQueue = () => {
  const jobs: { delaySeconds?: number; job: SyncJob }[] = [];
  let onSync: ((job: SyncJob) => Promise<void>) | undefined;

  const queue: JobQueue = {
    enqueueSync: (job, options = {}) => {
      jobs.push({ job, delaySeconds: options.delaySeconds });

      return Promise.resolve();
    },
    start: (handlers) => {
      onSync = handlers.onSync;

      return Promise.resolve();
    },
    stop: () => Promise.resolve(),
  };

  return {
    jobs,
    queue,
    /** Runs every collected job and returns the errors they threw */
    runAll: async () => {
      const errors: unknown[] = [];

      for (const { job } of jobs.splice(0))
        await onSync?.(job).catch((error: unknown) => errors.push(error));

      return errors;
    },
  };
};

const inlineQueue = createInlineQueue();
const { app, services } = createTestApp({ queue: inlineQueue });

/** Runs the periodic job of the default app once */
const tick = inlineQueue.tick;

/**
 * Creates an account and returns a function that makes requests as it,
 * against the default app or the one given.
 */
const createUser = async (id: string, target: typeof app = app) => {
  await database.db
    .insert(users)
    .values({ id, name: id, email: `${id}@example.test` })
    .onConflictDoNothing();

  return (path: string, init: RequestInit = {}) =>
    target.request(path, {
      ...init,
      // Like a browser, say which site the request comes from
      headers: { origin: APP_URL, ...init.headers, [USER_HEADER]: id },
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

export {
  api,
  app,
  APP_URL,
  createManualQueue,
  createTestApp,
  createUser,
  database,
  linkProfile,
  ME,
  scoreSaber,
  services,
  tick,
};
export type { Api };
