import { HTTPException } from 'hono/http-exception';

import { ScoreSaberError } from '../scoresaber/client.ts';

import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Every error the API returns has the same shape:
 *
 *   { "error": { "code": "not_found", "message": "..." } }
 *
 * `code` is for programs, `message` is for people reading logs. The
 * frontend shows a text of its own for each code, in the visitor's
 * language, so every situation a visitor should be told about apart from
 * the others needs a code of its own.
 */

type ErrorCode =
  | 'cannot_add_self'
  | 'forbidden'
  | 'hive_full'
  | 'internal_error'
  | 'no_player_linked'
  | 'not_found'
  | 'not_in_hive'
  | 'rate_limited'
  | 'scoresaber_unavailable'
  | 'unauthorized'
  | 'unknown_player'
  | 'validation_failed';

const statusOf: Record<ErrorCode, ContentfulStatusCode> = {
  cannot_add_self: 400,
  forbidden: 403,
  // `details.maxSize` says how many bees a hive may have
  hive_full: 400,
  internal_error: 500,
  // 409 Conflict: the request is fine, the account is not ready for it yet
  no_player_linked: 409,
  not_found: 404,
  not_in_hive: 404,
  rate_limited: 429,
  scoresaber_unavailable: 502,
  unauthorized: 401,
  unknown_player: 404,
  validation_failed: 400,
};

/** An error that is meant to reach the caller as it is */
class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

const body = (code: ErrorCode, message: string, details?: unknown) => ({
  error: { code, message, ...(details === undefined ? {} : { details }) },
});

/** Catches whatever a route throws and turns it into a response */
const handleError: ErrorHandler = (error, c) => {
  if (error instanceof AppError)
    return c.json(
      body(error.code, error.message, error.details),
      statusOf[error.code]
    );

  // Thrown by Hono's own middleware, for example when a request comes from
  // another site or its body is not valid JSON
  if (error instanceof HTTPException) {
    if (error.status === 403)
      return c.json(body('forbidden', 'This request is not allowed'), 403);
    if (error.status >= 400 && error.status < 500)
      return c.json(
        body('validation_failed', 'The request could not be read'),
        400
      );
  }

  if (error instanceof ScoreSaberError) {
    if (error.kind === 'not_found')
      return c.json(
        body('unknown_player', 'ScoreSaber does not know this player'),
        404
      );

    console.error(error);

    return c.json(
      body('scoresaber_unavailable', 'ScoreSaber could not be reached'),
      502
    );
  }

  // Anything else is a bug. Log everything, tell the caller nothing.
  console.error(error);

  return c.json(body('internal_error', 'Something went wrong'), 500);
};

const handleNotFound: NotFoundHandler = (c) =>
  c.json(body('not_found', `No route for ${c.req.method} ${c.req.path}`), 404);

export { AppError, handleError, handleNotFound };
export type { ErrorCode };
