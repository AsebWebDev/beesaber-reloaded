import { createMiddleware } from 'hono/factory';

import { AppError } from './errors.ts';

import type { Auth, SessionUser } from '../auth/auth.ts';

/** What routes behind `requireUser` can read with `c.get('user')` */
type UserEnv = {
  Variables: { user: SessionUser };
};

/** A signed-in user who has picked their ScoreSaber profile */
type Me = {
  playerId: string;
  userId: string;
};

/**
 * Lets a request through only when it comes with a valid session, and makes
 * the user available to the route.
 */
const requireUser = (auth: Auth) =>
  createMiddleware<UserEnv>(async (c, next) => {
    const user = await auth.getUser(c.req.raw.headers);

    if (user === null) throw new AppError('unauthorized', 'Not signed in');

    c.set('user', user);
    await next();
  });

/**
 * For routes that compare scores: the user also needs a ScoreSaber profile
 * to compare as.
 */
const requireMe = (user: SessionUser): Me => {
  if (user.playerId === null)
    throw new AppError(
      'no_player_linked',
      'Pick your ScoreSaber profile first'
    );

  return { userId: user.id, playerId: user.playerId };
};

export { requireMe, requireUser };
export type { Me, UserEnv };
