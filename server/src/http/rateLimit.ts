import { createMiddleware } from 'hono/factory';

import { AppError } from './errors.ts';

import type { UserEnv } from './session.ts';

type Options = {
  /** How many requests a user may make per window */
  limit: number;
  now?: () => number;
  windowMs: number;
};

/**
 * Stops a single account from flooding the API: after `limit` requests within
 * `windowMs`, further ones get a 429 until the window is over.
 *
 * The counters live in this process's memory. That is enough while one
 * server instance runs; with several, they would have to move to the
 * database.
 */
const rateLimit = ({ limit, now = Date.now, windowMs }: Options) => {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return createMiddleware<UserEnv>(async (c, next) => {
    const userId = c.get('user').id;
    const time = now();
    let window = windows.get(userId);

    if (window === undefined || window.resetAt <= time) {
      // Forget everyone whose window is over, so the map cannot grow forever
      for (const [key, value] of windows)
        if (value.resetAt <= time) windows.delete(key);

      window = { count: 0, resetAt: time + windowMs };
      windows.set(userId, window);
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

export { rateLimit };
