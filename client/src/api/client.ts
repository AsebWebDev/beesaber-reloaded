import { hc } from 'hono/client';

import type { AppType } from '@beesaber/server';

/**
 * The typed client for our API.
 *
 * `AppType` is the type of the server's routes. From it, `hc` builds an
 * object that mirrors them: `api.hive.$get()` calls `GET /api/hive` and knows
 * what comes back. Only the type is imported; no server code ends up in the
 * browser.
 */
const { api } = hc<AppType>(window.location.origin);

/** An answer from the API that says something went wrong */
class ApiError extends Error {
  /** Machine-readable, for example `not_found` or `no_player_linked` */
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { error?: { code?: string; message?: string } };

/**
 * Waits for a call and returns its JSON, or throws an ApiError.
 *
 * `fetch` does not treat a 404 or 500 as a failure. This does, so callers
 * get either data or an exception.
 */
const unwrap = async <Output>(
  request: Promise<{
    json: () => Promise<Output>;
    ok: boolean;
    status: number;
  }>
): Promise<Output> => {
  const response = await request;

  if (response.ok) return response.json();

  const body = (await response
    .json()
    .catch(() => ({}))) as unknown as ErrorBody;

  throw new ApiError(
    response.status,
    body.error?.code ?? 'unknown',
    body.error?.message ?? 'Something went wrong'
  );
};

export { api, ApiError, unwrap };
