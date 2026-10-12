import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import * as authSchema from '../db/authSchema.ts';

import type { Config } from '../config.ts';
import type { Database } from '../db/client.ts';

/**
 * Sign-in and sessions, handled by Better Auth.
 *
 * How a sign-in with Google works:
 * 1. The browser is sent to Google. The user agrees there.
 * 2. Google sends the browser back to /api/auth/callback/google with a code.
 * 3. Better Auth exchanges the code for the user's name and email, creates
 *    the `user` on first sign-in, stores a `session`, and sets a cookie.
 * 4. Every later request carries the cookie. `getUser` looks up the session
 *    behind it.
 *
 * The cookie holds only a random token. Everything else stays in the
 * database, so a session can be ended on the server at any time.
 */

/** The signed-in user, as the rest of the server sees them */
type SessionUser = {
  email: string;
  id: string;
  image: string | null;
  name: string;
  /** The ScoreSaber profile the user compares as, once they picked one */
  playerId: string | null;
};

/** What the app needs from sign-in. Tests provide their own version. */
type Auth = {
  /** Finds the user behind the session cookie of a request, if any */
  getUser: (headers: Headers) => Promise<SessionUser | null>;
  /** Answers everything under /api/auth: sign-in, callback, sign-out */
  handler: (request: Request) => Promise<Response>;
  /** Which ways to sign in are switched on. The frontend shows only these. */
  methods: { devLogin: boolean; google: boolean };
};

type AuthConfig = Pick<
  Config,
  | 'APP_URL'
  | 'AUTH_SECRET'
  | 'DEV_LOGIN'
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
>;

const createAuth = (db: Database, config: AuthConfig): Auth => {
  const auth = betterAuth({
    baseURL: config.APP_URL,
    secret: config.AUTH_SECRET,
    database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
    socialProviders:
      config.GOOGLE_CLIENT_ID !== undefined &&
      config.GOOGLE_CLIENT_SECRET !== undefined
        ? {
            google: {
              clientId: config.GOOGLE_CLIENT_ID,
              clientSecret: config.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
    // DEV_LOGIN switches on accounts with just an email and a password,
    // without any verification. The configuration only allows that while the
    // app is served from localhost.
    emailAndPassword: { enabled: config.DEV_LOGIN },
    // Better Auth has a rate limit of its own. It is off, because it keys on
    // a forwarded-address header and, without one, puts all visitors into a
    // single bucket of three sign-ins per ten seconds: one looping client
    // would lock everybody out. Our own per-address limit in app.ts covers
    // these routes instead.
    rateLimit: { enabled: false },
    user: {
      additionalFields: {
        // `input: false`: cannot be set through the sign-up request, only by
        // our own route after checking that the player exists
        playerId: { type: 'string', required: false, input: false },
      },
    },
  });

  return {
    methods: {
      devLogin: config.DEV_LOGIN,
      google: config.GOOGLE_CLIENT_ID !== undefined,
    },
    handler: (request) => auth.handler(request),
    getUser: async (headers) => {
      const session = await auth.api.getSession({ headers });

      if (session === null) return null;

      const { email, id, image, name, playerId } = session.user;

      return {
        id,
        email,
        name,
        image: image ?? null,
        playerId: playerId ?? null,
      };
    },
  };
};

export { createAuth };
export type { Auth, SessionUser };
