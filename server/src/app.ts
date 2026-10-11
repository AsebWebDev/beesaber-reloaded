import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { createHiveRepository } from './hive/hive.repository.ts';
import { createHiveRoutes } from './hive/hive.routes.ts';
import { createHiveService } from './hive/hive.service.ts';
import { currentPlayer } from './http/currentPlayer.ts';
import { handleError, handleNotFound } from './http/errors.ts';
import { createPlayersRepository } from './players/players.repository.ts';
import { createPlayersRoutes } from './players/players.routes.ts';
import { createPlayersService } from './players/players.service.ts';

import type { Database } from './db/client.ts';
import type { CurrentPlayerEnv } from './http/currentPlayer.ts';
import type { ScoreSaberClient } from './scoresaber/client.ts';

type Dependencies = {
  db: Database;
  /** TEMPORARY, see http/currentPlayer.ts */
  devPlayerId?: string;
  logRequests?: boolean;
  scoreSaber: ScoreSaberClient;
};

/**
 * Wires the app together: repositories get the database, services get the
 * repositories, routes get the services.
 *
 * Everything the app needs from outside comes in as an argument. That is why
 * a test can build the same app with a test database and a fake ScoreSaber.
 */
const createApp = ({
  db,
  devPlayerId,
  logRequests = false,
  scoreSaber,
}: Dependencies) => {
  const playersService = createPlayersService({
    repository: createPlayersRepository(db),
    scoreSaber,
  });
  const hiveService = createHiveService({
    repository: createHiveRepository(db),
    playersService,
  });

  const app = new Hono<CurrentPlayerEnv>().basePath('/api');

  if (logRequests) app.use(logger());

  app.onError(handleError);
  app.notFound(handleNotFound);

  // Says whether the server is up and can reach its database
  app.get('/health', async (c) => {
    await db.execute(sql`select 1`);

    return c.json({ status: 'ok' });
  });

  app.route('/players', createPlayersRoutes(playersService));

  // Everything below needs to know who is asking
  app.use('/me', currentPlayer(devPlayerId));
  app.use('/hive/*', currentPlayer(devPlayerId));
  app.use('/hive', currentPlayer(devPlayerId));

  app.get('/me', async (c) =>
    c.json(await playersService.getOrSyncPlayer(c.get('playerId')))
  );
  app.route('/hive', createHiveRoutes(hiveService));

  return app;
};

export { createApp };
