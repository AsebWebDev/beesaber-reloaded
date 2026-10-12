import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { createHiveRoutes } from './hive/hive.routes.ts';
import { AppError, handleError, handleNotFound } from './http/errors.ts';
import { byAddress, byUser, rateLimit } from './http/rateLimit.ts';
import { requireUser } from './http/session.ts';
import { createMeRoutes } from './me/me.routes.ts';
import { createPlayersRoutes } from './players/players.routes.ts';

import type { Auth } from './auth/auth.ts';
import type { Database } from './db/client.ts';
import type { UserEnv } from './http/session.ts';
import type { Services } from './services.ts';

/** How much one caller may do. See createApp for what each one guards. */
type Limits = {
  /** Requests per minute of a signed-in account, all routes together */
  perMinute: number;
  /** Per account and hour: picking a profile or adding a bee */
  playerActionsPerHour: number;
  /** Requests per minute of one address to the routes that need no session */
  publicPerMinute: number;
  /** Player searches per minute of an account */
  searchesPerMinute: number;
};

const DEFAULT_LIMITS: Limits = {
  perMinute: 120,
  playerActionsPerHour: 30,
  publicPerMinute: 60,
  searchesPerMinute: 30,
};

const MINUTE = 60_000;

type Dependencies = {
  /** The address of the frontend, the only site allowed to send forms */
  appUrl: string;
  auth: Auth;
  db: Database;
  limits?: Partial<Limits>;
  logRequests?: boolean;
  services: Services;
  /** See TRUST_PROXY in config.ts */
  trustProxy?: boolean;
};

/**
 * The HTTP side of the server: middleware and routes on top of the services
 * (see services.ts).
 *
 * Everything the app needs from outside comes in as an argument. That is why
 * a test can build the same app with a test database, a fake ScoreSaber and
 * a fake sign-in.
 */
const createApp = ({
  appUrl,
  auth,
  db,
  limits: givenLimits,
  logRequests = false,
  services: { hiveService, playersService },
  trustProxy = false,
}: Dependencies) => {
  const limits = { ...DEFAULT_LIMITS, ...givenLimits };

  // The routes open to everyone have no account to count by, so they are
  // limited per address. This also keeps sign-in from being hammered.
  const publicLimit = rateLimit({
    key: byAddress(trustProxy),
    limit: limits.publicPerMinute,
    windowMs: MINUTE,
  });
  // Every search is a request to ScoreSaber
  const searchLimit = rateLimit({
    key: byUser,
    limit: limits.searchesPerMinute,
    windowMs: MINUTE,
  });
  // Picking a profile or adding a bee can make the server fetch thousands of
  // scores. One budget for both, so neither can be used to queue endless work.
  const playerActionLimit = rateLimit({
    key: byUser,
    limit: limits.playerActionsPerHour,
    windowMs: 60 * MINUTE,
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
      .get('/health', publicLimit, async (c) => {
        await db.execute(sql`select 1`);

        return c.json({ status: 'ok' });
      })
      .get('/config', publicLimit, (c) => c.json({ signIn: auth.methods }))
      .on(['GET', 'POST'], '/auth/*', publicLimit, (c) =>
        auth.handler(c.req.raw)
      )

      // Everything registered below this line needs a session
      .use(requireUser(auth))
      .use(
        rateLimit({ key: byUser, limit: limits.perMinute, windowMs: MINUTE })
      )

      .route('/me', createMeRoutes({ db, playerActionLimit, playersService }))
      .route('/players', createPlayersRoutes(playersService, searchLimit))
      .route('/hive', createHiveRoutes(hiveService, playerActionLimit))
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
export type { AppType, Limits };
