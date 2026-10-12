import { getConnInfo } from '@hono/node-server/conninfo';
import { createMiddleware } from 'hono/factory';

import { AppError } from './errors.ts';

import type { Context } from 'hono';
import type { UserEnv } from './session.ts';

type Options = {
  /** Who a request is counted for: the account, or the caller's address */
  key: (c: Context<UserEnv>) => string;
  /** How many requests one key may make per window */
  limit: number;
  now?: () => number;
  windowMs: number;
};

/**
 * Stops one caller from flooding the API: after `limit` requests within
 * `windowMs`, further ones get a 429 until the window is over.
 *
 * Every call of this function keeps its own counters, so several limits can
 * apply to the same request, for example a general one per account and a
 * tighter one on the routes that make the server call ScoreSaber.
 *
 * The counters live in this process's memory. That is enough while one
 * server instance runs; with several, they would have to move to the
 * database.
 */
const rateLimit = ({ key, limit, now = Date.now, windowMs }: Options) => {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return createMiddleware<UserEnv>(async (c, next) => {
    const caller = key(c);
    const time = now();
    let window = windows.get(caller);

    if (window === undefined || window.resetAt <= time) {
      // Forget everyone whose window is over, so the map cannot grow forever
      for (const [name, value] of windows)
        if (value.resetAt <= time) windows.delete(name);

      window = { count: 0, resetAt: time + windowMs };
      windows.set(caller, window);
    }

    window.count += 1;

    if (window.count > limit) {
      c.header(
        'Retry-After',
        String(Math.ceil((window.resetAt - time) / 1000))
      );

      throw new AppError('rate_limited', 'Too many requests, slow down');
    }

    await next();
  });
};

/** Counts per signed-in account. Only for routes behind `requireUser`. */
const byUser = (c: Context<UserEnv>): string => c.get('user').id;

/**
 * Counts per network address, for routes that are open to everyone.
 *
 * Behind a reverse proxy every connection comes from the proxy, and the real
 * address is in `X-Forwarded-For`. That header is only believed when
 * `trustProxy` says there is a proxy, because otherwise a caller could write
 * anything into it and never be limited. The last entry is used: it is the
 * one our own proxy added, the ones before it are supplied by the caller.
 */
const byAddress =
  (trustProxy: boolean) =>
  (c: Context<UserEnv>): string => {
    if (trustProxy) {
      const forwarded = c.req.header('x-forwarded-for')?.split(',').at(-1);

      if (forwarded !== undefined && forwarded.trim() !== '')
        return forwarded.trim();
    }

    try {
      return getConnInfo(c).remote.address ?? 'unknown';
    } catch {
      // No socket behind the request, as in tests that call the app directly
      return 'unknown';
    }
  };

export { byAddress, byUser, rateLimit };
