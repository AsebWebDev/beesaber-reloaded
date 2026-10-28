import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { AppError } from './errors.ts';

import type { ValidationTargets } from 'hono';

/**
 * Checks one part of a request (path parameters, query string or JSON body)
 * against a zod schema before the route runs.
 *
 * In the route, `c.req.valid('query')` then returns the checked values with
 * the types the schema describes. Anything that does not fit never reaches
 * the route; the caller gets a 400 that names the fields.
 */
const validate = <
  Target extends keyof ValidationTargets,
  Schema extends z.ZodType,
>(
  target: Target,
  schema: Schema
) =>
  zValidator(target, schema, (result) => {
    if (!result.success)
      throw new AppError(
        'validation_failed',
        `Invalid ${target}`,
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      );
  });

/**
 * A ScoreSaber player id: a Steam or Oculus id, digits only. No leading
 * zero, so that every player has exactly one way to write their id.
 */
const playerId = z.string().regex(/^[1-9]\d{0,19}$/, 'must be a ScoreSaber id');

/** Query parameters of every list that comes in pages */
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const paginated = <Item>(
  items: Item[],
  total: number,
  { limit, page }: { limit: number; page: number }
) => ({
  items,
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export { paginated, pagination, playerId, validate };
