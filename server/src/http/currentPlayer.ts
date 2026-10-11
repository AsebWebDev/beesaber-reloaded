import { createMiddleware } from 'hono/factory';

import { AppError } from './errors.ts';

/** What routes behind this middleware can read with `c.get(...)` */
type CurrentPlayerEnv = {
  Variables: {
    /** The ScoreSaber id of the player making the request */
    playerId: string;
  };
};

/**
 * Finds out who is making the request.
 *
 * TEMPORARY: until sign-in exists (phase 4), everyone is the player from the
 * DEV_PLAYER_ID setting. The routes only ever read `c.get('playerId')`, so
 * replacing this with a real session changes this file and nothing else.
 */
const currentPlayer = (devPlayerId: string | undefined) =>
  createMiddleware<CurrentPlayerEnv>(async (c, next) => {
    if (devPlayerId === undefined)
      throw new AppError(
        'unauthorized',
        'Not signed in. Set DEV_PLAYER_ID in server/.env for now.'
      );

    c.set('playerId', devPlayerId);
    await next();
  });

export { currentPlayer };
export type { CurrentPlayerEnv };
