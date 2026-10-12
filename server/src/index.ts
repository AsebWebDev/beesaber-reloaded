import { serve } from '@hono/node-server';

import { createApp } from './app.ts';
import { createAuth } from './auth/auth.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';
import { createPgBossQueue } from './jobs/queue.ts';
import { createScoreSaberClient } from './scoresaber/client.ts';
import { createLiveFeed } from './scoresaber/liveFeed.ts';
import { createThrottledFetch } from './scoresaber/throttledFetch.ts';
import { createServices, startJobs } from './services.ts';

// The entry point: read the configuration, connect to the outside world,
// start listening. Everything else is built from these pieces.
const config = loadConfig();
const { db, close } = createDatabase(config.DATABASE_URL);
const queue = createPgBossQueue(config.DATABASE_URL);

const services = createServices({
  db,
  queue,
  scoreSaber: createScoreSaberClient({
    baseUrl: config.SCORESABER_URL,
    fetch: createThrottledFetch(),
  }),
});

const app = createApp({
  appUrl: config.APP_URL,
  auth: createAuth(db, config),
  db,
  logRequests: true,
  services,
});

// Background work: the job queue, and the live feed that puts jobs on it
await startJobs(queue, services);
console.log('Job queue started');

const liveFeed = createLiveFeed({
  url: config.LIVE_FEED_URL,
  onScore: (playerId) => {
    services.playersService.handleLiveScore(playerId).then(
      (tracked) => {
        if (tracked)
          console.log('Live feed: score of a tracked player, sync queued');
      },
      (error: unknown) => console.error('Live feed handler failed', error)
    );
  },
});

if (config.LIVE_FEED) liveFeed.start();
else console.log('Live feed is off: LIVE_FEED=false');

const server = serve({ fetch: app.fetch, port: config.PORT }, ({ port }) => {
  console.log(`API listening on http://localhost:${port}/api`);

  if (config.GOOGLE_CLIENT_ID === undefined)
    console.log('Sign-in with Google is off: GOOGLE_CLIENT_ID is not set');
  if (config.DEV_LOGIN)
    console.log('DEV_LOGIN is on: the local test account can sign in');
});

// When asked to stop: take no new work, finish what is running, then close
// the connections, instead of cutting everything off
const shutdown = () => {
  liveFeed.stop();
  server.close(() => {
    void queue
      .stop()
      .then(close)
      .then(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
