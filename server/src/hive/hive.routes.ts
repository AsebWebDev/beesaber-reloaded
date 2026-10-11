import { Hono } from 'hono';
import { z } from 'zod';

import { paginated, pagination, playerId, validate } from '../http/validate.ts';

import type { CurrentPlayerEnv } from '../http/currentPlayer.ts';
import type { HiveService } from './hive.service.ts';

/**
 * The hive of the player making the request. There is no player id for the
 * owner in these paths on purpose: it comes from the session, so nobody can
 * read or change somebody else's hive by editing a URL.
 */
const createHiveRoutes = (service: HiveService) =>
  new Hono<CurrentPlayerEnv>()
    // GET /api/hive
    .get('/', async (c) =>
      c.json({ items: await service.listMembers(c.get('playerId')) })
    )

    // POST /api/hive  { "playerId": "7656..." }
    .post('/', validate('json', z.object({ playerId })), async (c) => {
      const { playerId: memberId } = c.req.valid('json');

      return c.json(await service.addMember(c.get('playerId'), memberId), 201);
    })

    // POST /api/hive/sync
    .post('/sync', async (c) =>
      c.json({ items: await service.syncAll(c.get('playerId')) })
    )

    // GET /api/hive/news?limit=20
    .get(
      '/news',
      validate('query', z.object({ limit: pagination.limit })),
      async (c) => {
        const { limit } = c.req.valid('query');

        return c.json({
          items: await service.listNews(c.get('playerId'), limit),
        });
      }
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
          c.get('playerId'),
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
          c.get('playerId'),
          c.req.valid('param').playerId
        );

        return c.body(null, 204);
      }
    );

export { createHiveRoutes };
