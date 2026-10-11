import { z } from 'zod';

/**
 * Everything the server reads from the environment, in one place.
 *
 * The values are checked once at startup. A missing or malformed variable
 * stops the server right away with a message that names it, instead of
 * surfacing later as an obscure error in the middle of a request.
 */
const schema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5001),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    SCORESABER_URL: z.url().default('https://scoresaber.com'),

    // The address people open in their browser. Sign-in redirects go here.
    APP_URL: z.url().default('http://localhost:3000'),
    // Signs the session cookies. Whoever knows it can forge a session.
    AUTH_SECRET: z.string().min(32, 'must be at least 32 characters'),
    // From the Google Cloud Console. Without them, sign-in with Google is off.
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // Lets the client sign in as a local test account, without Google
    DEV_LOGIN: z.stringbool().default(false),
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
