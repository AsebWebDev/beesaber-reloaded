import { ScoreSaberError } from '../scoresaber/client.ts';

import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Every error the API returns has the same shape:
 *
 *   { "error": { "code": "not_found", "message": "..." } }
 *
 * `code` is for programs, `message` is for people.
 */

type ErrorCode =
  | 'internal_error'
  | 'no_player_linked'
  | 'not_found'
  | 'scoresaber_unavailable'
  | 'unauthorized'
  | 'validation_failed';

const statusOf: Record<ErrorCode, ContentfulStatusCode> = {
  internal_error: 500,
  // 409 Conflict: the request is fine, the account is not ready for it yet
  no_player_linked: 409,
  not_found: 404,
  scoresaber_unavailable: 502,
  unauthorized: 401,
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

  if (error instanceof ScoreSaberError) {
    if (error.kind === 'not_found')
      return c.json(
        body('not_found', 'ScoreSaber does not know this player'),
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
