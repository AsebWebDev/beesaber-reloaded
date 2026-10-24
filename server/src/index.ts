import { serve } from '@hono/node-server';

import { createApp } from './app.ts';
import { createAuth } from './auth/auth.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';
import { runMigrations } from './db/migrate.ts';
import { databasePassword } from './db/password.ts';
import { withCanonicalHost } from './http/canonicalHost.ts';
import { withFrontend } from './http/frontend.ts';
import { createPgBossQueue } from './jobs/queue.ts';
import { createScoreSaberClient } from './scoresaber/client.ts';
import { createLiveFeed } from './scoresaber/liveFeed.ts';
import { createThrottledFetch } from './scoresaber/throttledFetch.ts';
import { createServices, startJobs } from './services.ts';

// The entry point: read the configuration, connect to the outside world,
// start listening. Everything else is built from these pieces.
const config = loadConfig();
const password = databasePassword(config.DATABASE_IDENTITY_CLIENT_ID);

// The code of this version expects the tables of this version. If they
// cannot be brought up to date, the server stops here instead of running
// against the wrong schema.
await runMigrations(config.DATABASE_URL, password);
console.log('Database is up to date');

const { db, close } = createDatabase(config.DATABASE_URL, { password });
const queue = createPgBossQueue(config.DATABASE_URL, password);

const services = createServices({
  db,
  queue,
  scoreSaber: createScoreSaberClient({
    baseUrl: config.SCORESABER_URL,
    // Two lanes to ScoreSaber, so that a background sync of thousands of
    // scores cannot keep a user's search or "add bee" waiting. Together they
    // send at most about 20 requests a second; ScoreSaber allows 25.
    fetch: createThrottledFetch({ minIntervalMs: 120 }),
    backgroundFetch: createThrottledFetch({ minIntervalMs: 80 }),
  }),
});

const app = createApp({
  appUrl: config.APP_URL,
  auth: createAuth(db, config),
  db,
  logRequests: true,
  services,
  trustProxy: config.TRUST_PROXY,
});

// Background work: the job queue, and the live feed that puts jobs on it
await startJobs(queue, services);
console.log('Job queue started');

const liveFeed = createLiveFeed({
  url: config.LIVE_FEED_URL,
  onScore: async (playerId) => {
    if (await services.playersService.handleLiveScore(playerId))
      console.log('Live feed: score of a tracked player, sync queued');
  },
});

if (config.LIVE_FEED) liveFeed.start();
else console.log('Live feed is off: LIVE_FEED=false');

const site = withCanonicalHost(
  config.FRONTEND_DIR === undefined
    ? app
    : withFrontend(app, config.FRONTEND_DIR),
  config.APP_URL
);

const server = serve({ fetch: site.fetch, port: config.PORT }, ({ port }) => {
  console.log(`API listening on http://localhost:${port}/api`);

  if (config.FRONTEND_DIR !== undefined)
    console.log(
      `Frontend from ${config.FRONTEND_DIR} on http://localhost:${port}`
    );

  if (config.GOOGLE_CLIENT_ID === undefined)
    console.log('Sign-in with Google is off: GOOGLE_CLIENT_ID is not set');
  if (config.DEV_LOGIN)
    console.log('DEV_LOGIN is on: the local test account can sign in');
});

// After a pause, like a restart or a wake-up from scale-to-zero, the scores
// of tracked players may be far behind. Catch up now instead of at the next
// tick of the timer, which can be 15 minutes away. Requests are answered in
// the meantime, and a failure here only costs the head start.
services.playersService
  .syncStalePlayers()
  .then((count) => console.log(`Catching up: ${count} players with old scores`))
  .catch((error: unknown) => console.error('Catching up failed', error));

/** How long a shutdown may take before the process ends regardless */
const SHUTDOWN_DEADLINE_MS = 15_000;

let shuttingDown = false;

// When asked to stop: take no new work, finish what is running, then close
// the connections, instead of cutting everything off. But not forever: a
// request or a job that hangs must not keep a deployment from finishing.
const shutdown = (signal: string) => {
  // A second Ctrl+C while we are at it changes nothing
  if (shuttingDown) return;

  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  const deadline = setTimeout(() => {
    console.error('Shutdown took too long, exiting anyway');
    process.exit(1);
  }, SHUTDOWN_DEADLINE_MS);

  // The timer alone must not keep the process alive once everything is closed
  deadline.unref();

  liveFeed.stop();
  server.close(() => {
    queue
      .stop()
      .then(close)
      .then(
        () => process.exit(0),
        (error: unknown) => {
          console.error('Shutdown failed', error);
          process.exit(1);
        }
      );
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
