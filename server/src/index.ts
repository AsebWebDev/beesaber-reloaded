import { serve } from '@hono/node-server';

import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';
import { createScoreSaberClient } from './scoresaber/client.ts';
import { createThrottledFetch } from './scoresaber/throttledFetch.ts';

// The entry point: read the configuration, connect to the outside world,
// start listening. Everything else is built from these pieces.
const config = loadConfig();
const { db, close } = createDatabase(config.DATABASE_URL);

const app = createApp({
  db,
  devPlayerId: config.DEV_PLAYER_ID,
  logRequests: true,
  scoreSaber: createScoreSaberClient({
    baseUrl: config.SCORESABER_URL,
    fetch: createThrottledFetch(),
  }),
});

const server = serve({ fetch: app.fetch, port: config.PORT }, ({ port }) => {
  console.log(`API listening on http://localhost:${port}/api`);
});

// Finish running requests and close the database connections when asked to
// stop, instead of cutting them off
const shutdown = () => {
  server.close(() => {
    void close().then(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
