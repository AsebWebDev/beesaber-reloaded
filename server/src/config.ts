import { z } from 'zod';

/**
 * Everything the server reads from the environment, in one place.
 *
 * The values are checked once at startup. A missing or malformed variable
 * stops the server right away with a message that names it, instead of
 * surfacing later as an obscure error in the middle of a request.
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** True for an address that only this machine can reach */
const isLocal = (url: string) => LOCAL_HOSTS.includes(new URL(url).hostname);

const schema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5001),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    SCORESABER_URL: z.url().default('https://scoresaber.com'),
    // The WebSocket on which ScoreSaber announces every new score. With
    // LIVE_FEED=false, scores arrive with the periodic sync only.
    LIVE_FEED: z.stringbool().default(true),
    LIVE_FEED_URL: z
      .url({ protocol: /^wss?$/ })
      .default('wss://scoresaber.com/ws'),

    // The address people open in their browser, without a path. Sign-in
    // redirects go here, and only this site may send forms to the API.
    APP_URL: z
      .url({ protocol: /^https?$/ })
      .default('http://localhost:3000')
      // "https://example.org/" and "https://example.org" are the same site
      .transform((url) => new URL(url).origin),
    // Signs the session cookies. Whoever knows it can forge a session.
    AUTH_SECRET: z.string().min(32, 'must be at least 32 characters'),
    // From the Google Cloud Console. Without them, sign-in with Google is off.
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // Lets anyone create an account with just an email and a password, with
    // no verification. Meant for trying the app on your own machine.
    DEV_LOGIN: z.stringbool().default(false),
    // True when the server runs behind a reverse proxy that sets
    // X-Forwarded-For. Without a proxy this must stay false, or callers
    // could fake their address and dodge the rate limit.
    TRUST_PROXY: z.stringbool().default(false),
  })
  .refine(
    (config) =>
      (config.GOOGLE_CLIENT_ID === undefined) ===
      (config.GOOGLE_CLIENT_SECRET === undefined),
    {
      path: ['GOOGLE_CLIENT_SECRET'],
      message: 'set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET together',
    }
  )
  // The next two guards look at where the app is served from, not at
  // NODE_ENV. NODE_ENV is easy to forget on a server, and forgetting it must
  // not open the app up.
  .refine((config) => !config.DEV_LOGIN || isLocal(config.APP_URL), {
    path: ['DEV_LOGIN'],
    message: 'is only allowed while APP_URL points to this machine (localhost)',
  })
  .refine(
    (config) => isLocal(config.APP_URL) || config.APP_URL.startsWith('https:'),
    {
      path: ['APP_URL'],
      message: 'must use https unless it points to this machine (localhost)',
    }
  )
  .refine((config) => !(config.DEV_LOGIN && config.NODE_ENV === 'production'), {
    path: ['DEV_LOGIN'],
    message: 'must not be enabled in production',
  });

type Config = z.infer<typeof schema>;

const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  // An empty value in .env means "not set"
  const withoutEmpty = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== '')
  );
  const result = schema.safeParse(withoutEmpty);

  if (!result.success) {
    throw new Error(
      `Invalid configuration, check server/.env:\n${z.prettifyError(result.error)}`
    );
  }

  return result.data;
};

export { loadConfig };
export type { Config };
