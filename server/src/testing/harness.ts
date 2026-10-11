import { afterAll, afterEach, beforeEach } from 'vitest';

import { createApp } from '../app.ts';
import { createScoreSaberClient } from '../scoresaber/client.ts';
import { createTestDatabase } from './database.ts';
import { createFakeScoreSaber, FAKE_SCORESABER_URL } from './fakeScoreSaber.ts';

/**
 * What a test file gets by importing this: an empty database before every
 * test, a fake ScoreSaber, and the app wired to both. Tests call
 * `app.request(...)`, no server is started and no port is opened.
 */

const ME = '76561198000000001';

const database = createTestDatabase();
const scoreSaber = createFakeScoreSaber();

const app = createApp({
  db: database.db,
  devPlayerId: ME,
  // The client talks to the fake instead of the network, so no test can
  // reach the real ScoreSaber by accident
  scoreSaber: createScoreSaberClient({
    baseUrl: FAKE_SCORESABER_URL,
    fetch: scoreSaber.fetch,
  }),
});

beforeEach(async () => {
  await database.reset();
});

afterEach(() => {
  scoreSaber.reset();
});

afterAll(async () => {
  await database.close();
});

export { app, database, ME, scoreSaber };
