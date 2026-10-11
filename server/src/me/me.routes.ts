import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { user as users } from '../db/authSchema.ts';
import { playerId, validate } from '../http/validate.ts';

import type { Database } from '../db/client.ts';
import type { UserEnv } from '../http/session.ts';
import type { PlayersService } from '../players/players.service.ts';

type Dependencies = {
  db: Database;
  playersService: PlayersService;
};

/** The signed-in user and the ScoreSaber profile they compare as */
const createMeRoutes = ({ db, playersService }: Dependencies) =>
  new Hono<UserEnv>()
    // GET /api/me
    .get('/', async (c) => {
      const user = c.get('user');

      return c.json({
        user,
        player:
          user.playerId === null
            ? null
            : await playersService.getOrSyncPlayer(user.playerId),
      });
    })

    // PUT /api/me/player  { "playerId": "7656..." }
    // Picks the ScoreSaber profile to compare as. Nothing proves that the
    // profile belongs to the user; all it exposes is public data.
    .put('/player', validate('json', z.object({ playerId })), async (c) => {
      const user = c.get('user');
      const { playerId: chosenId } = c.req.valid('json');

      // Fetches the profile and all scores. Throws a 404 if ScoreSaber does
      // not know the id, so only existing players can be linked.
      await playersService.syncPlayer(chosenId);
      await db
        .update(users)
        .set({ playerId: chosenId })
        .where(eq(users.id, user.id));

      return c.json({
        user: { ...user, playerId: chosenId },
        player: await playersService.getOrSyncPlayer(chosenId),
      });
    });

export { createMeRoutes };
