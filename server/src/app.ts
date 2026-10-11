import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { createHiveRepository } from './hive/hive.repository.ts';
import { createHiveRoutes } from './hive/hive.routes.ts';
import { createHiveService } from './hive/hive.service.ts';
import { AppError, handleError, handleNotFound } from './http/errors.ts';
import { rateLimit } from './http/rateLimit.ts';
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
  /** The address of the frontend, the only site allowed to send forms */
  appUrl: string;
  auth: Auth;
  db: Database;
  logRequests?: boolean;
  /** See players.service.ts */
  minSyncIntervalMs?: number;
  /** Requests per minute a single account may make */
  requestsPerMinute?: number;
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
  appUrl,
  auth,
  db,
  logRequests = false,
  minSyncIntervalMs,
  requestsPerMinute = 120,
  scoreSaber,
}: Dependencies) => {
  const playersService = createPlayersService({
    minSyncIntervalMs,
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

  // Headers that tell browsers to be strict: no embedding in other pages,
  // no guessing of content types, HTTPS only once it was used
  app.use(secureHeaders());
  // A form on another website must not be able to act with the visitor's
  // session. Requests that could come from a form are only accepted from
  // our own frontend. (JSON requests cannot be sent by a foreign form.)
  app.use(csrf({ origin: appUrl }));
  // Nothing this API accepts is large. Refuse the rest before reading it.
  app.use(
    bodyLimit({
      maxSize: 100 * 1024,
      onError: () => {
        throw new AppError('validation_failed', 'Request body too large');
      },
    })
  );

  // The routes are chained into one expression on purpose: that way their
  // paths, inputs and answers add up to one type, which the frontend imports
  // (see AppType below).
  return (
    app
      // Open to everyone: is the server up, which ways to sign in exist,
      // and sign-in itself
      .get('/health', async (c) => {
        await db.execute(sql`select 1`);

        return c.json({ status: 'ok' });
      })
      .get('/config', (c) => c.json({ signIn: auth.methods }))
      .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))

      // Everything registered below this line needs a session
      .use(requireUser(auth))
      .use(rateLimit({ limit: requestsPerMinute, windowMs: 60_000 }))

      .route('/me', createMeRoutes({ db, playersService }))
      .route('/players', createPlayersRoutes(playersService))
      .route('/hive', createHiveRoutes(hiveService))
  );
};

/**
 * The whole API as a type: every path with what it takes and what it
 * returns. The frontend builds its client from this, so a call to a path
 * that does not exist, or a read of a field that is not there, fails the
 * type check instead of failing in the browser.
 */
type AppType = ReturnType<typeof createApp>;

export { createApp };
export type { AppType };
