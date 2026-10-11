import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { createHiveRepository } from './hive/hive.repository.ts';
import { createHiveRoutes } from './hive/hive.routes.ts';
import { createHiveService } from './hive/hive.service.ts';
import { handleError, handleNotFound } from './http/errors.ts';
import { requireUser } from './http/session.ts';
import { createMeRoutes } from './me/me.routes.ts';
import { createPlayersRepository } from './players/players.repository.ts';
import { createPlayersRoutes } from './players/players.routes.ts';
import { createPlayersService } from './players/players.service.ts';

import type { Auth } from './auth/auth.ts';
import type { Database } from './db/client.ts';
import type { UserEnv } from './http/session.ts';
import type { ScoreSaberClient } from './scoresaber/client.ts';

type Dependencies = {
  auth: Auth;
  db: Database;
  logRequests?: boolean;
  scoreSaber: ScoreSaberClient;
};

/**
 * Wires the app together: repositories get the database, services get the
 * repositories, routes get the services.
 *
 * Everything the app needs from outside comes in as an argument. That is why
 * a test can build the same app with a test database, a fake ScoreSaber and
 * a fake sign-in.
 */
const createApp = ({
  auth,
  db,
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

  const app = new Hono<UserEnv>().basePath('/api');

  if (logRequests) app.use(logger());

  app.onError(handleError);
  app.notFound(handleNotFound);

  // Open to everyone: is the server up, and sign-in itself
  app.get('/health', async (c) => {
    await db.execute(sql`select 1`);

    return c.json({ status: 'ok' });
  });
  app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));

  // Everything registered below this line needs a session
  app.use(requireUser(auth));

  app.route('/me', createMeRoutes({ db, playersService }));
  app.route('/players', createPlayersRoutes(playersService));
  app.route('/hive', createHiveRoutes(hiveService));

  return app;
};

export { createApp };
