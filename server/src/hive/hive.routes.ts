import { Hono } from 'hono';
import { z } from 'zod';

import { requireMe } from '../http/session.ts';
import { paginated, pagination, playerId, validate } from '../http/validate.ts';

import type { MiddlewareHandler } from 'hono';
import type { UserEnv } from '../http/session.ts';
import type { HiveService } from './hive.service.ts';

/**
 * The hive of the signed-in user. There is no user id in these paths on
 * purpose: it comes from the session, so nobody can read or change somebody
 * else's hive by editing a URL.
 */
const createHiveRoutes = (
  service: HiveService,
  /** Limits how often a user can make the server fetch a new player */
  playerActionLimit: MiddlewareHandler<UserEnv>
) =>
  new Hono<UserEnv>()
    // GET /api/hive
    .get('/', async (c) =>
      c.json({ items: await service.listMembers(requireMe(c.get('user'))) })
    )

    // POST /api/hive  { "playerId": "7656..." }
    .post(
      '/',
      playerActionLimit,
      validate('json', z.object({ playerId })),
      async (c) => {
        const { playerId: memberId } = c.req.valid('json');
        const player = await service.addMember(
          requireMe(c.get('user')),
          memberId
        );

        return c.json({ player }, 201);
      }
    )

    // GET /api/hive/sync: who is being fetched right now?
    .get('/sync', async (c) =>
      c.json({
        syncing: await service.listSyncing(requireMe(c.get('user'))),
      })
    )

    // POST /api/hive/sync
    .post('/sync', async (c) =>
      c.json(await service.syncAll(requireMe(c.get('user'))), 202)
    )

    // GET /api/hive/news?limit=20
    .get(
      '/news',
      validate('query', z.object({ limit: pagination.limit })),
      async (c) => {
        const { limit } = c.req.valid('query');

        return c.json({
          items: await service.listNews(requireMe(c.get('user')), limit),
        });
      }
    )

    // GET /api/hive/maps/1234: how I and my bees stand on one map
    .get(
      '/maps/:leaderboardId',
      validate(
        'param',
        z.object({ leaderboardId: z.coerce.number().int().min(1) })
      ),
      async (c) =>
        c.json(
          await service.mapRanking(
            requireMe(c.get('user')),
            c.req.valid('param').leaderboardId
          )
        )
    )

    // GET /api/hive/:playerId/comparison?filter=losing&page=1&limit=20
    .get(
      '/:playerId/comparison',
      validate('param', z.object({ playerId })),
      validate(
        'query',
        z.object({
          ...pagination,
          filter: z.enum(['all', 'losing', 'winning']).default('all'),
        })
      ),
      async (c) => {
        const { playerId: memberId } = c.req.valid('param');
        const query = c.req.valid('query');
        const { items, total } = await service.compare(
          requireMe(c.get('user')),
          memberId,
          query
        );

        return c.json(paginated(items, total, query));
      }
    )

    // DELETE /api/hive/:playerId
    .delete(
      '/:playerId',
      validate('param', z.object({ playerId })),
      async (c) => {
        await service.removeMember(
          requireMe(c.get('user')),
          c.req.valid('param').playerId
        );

        return c.body(null, 204);
      }
    );

export { createHiveRoutes };
