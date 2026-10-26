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
  /** Machine-readable, for example `not_in_hive` or `no_player_linked` */
  readonly code: string;
  /** Values the text for the code may need, like the limit for `hive_full` */
  readonly details: Record<string, unknown> | undefined;
  readonly status: number;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ErrorBody = {
  error?: { code?: string; details?: unknown; message?: string };
};

/** Reads the error a failed response carries */
const apiErrorOf = async (response: {
  json: () => Promise<unknown>;
  status: number;
}): Promise<ApiError> => {
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  const details = body.error?.details;

  return new ApiError(
    response.status,
    body.error?.code ?? 'unknown',
    body.error?.message ?? 'Something went wrong',
    typeof details === 'object' && details !== null && !Array.isArray(details)
      ? (details as Record<string, unknown>)
      : undefined
  );
};

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

  throw await apiErrorOf(response);
};

export { api, ApiError, apiErrorOf, unwrap };
