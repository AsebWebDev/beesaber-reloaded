import { z } from 'zod';

/**
 * Everything the server reads from the environment, in one place.
 *
 * The values are checked once at startup. A missing or malformed variable
 * stops the server right away with a message that names it, instead of
 * surfacing later as an obscure error in the middle of a request.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  SCORESABER_URL: z.url().default('https://scoresaber.com'),
  // TEMPORARY, until sign-in exists: every request counts as this player
  DEV_PLAYER_ID: z
    .string()
    .regex(/^\d+$/, 'must be a numeric ScoreSaber id')
    .optional(),
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
