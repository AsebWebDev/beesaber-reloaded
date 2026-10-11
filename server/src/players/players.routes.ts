import { Hono } from 'hono';
import { z } from 'zod';

import { paginated, pagination, playerId, validate } from '../http/validate.ts';

import type { PlayersService } from './players.service.ts';

/**
 * The HTTP side of players: read the request, call the service, shape the
 * answer. No rules and no SQL in here.
 */
const createPlayersRoutes = (service: PlayersService) =>
  new Hono()
    // GET /api/players/search?q=name
    .get(
      '/search',
      validate('query', z.object({ q: z.string().trim().min(3).max(64) })),
      async (c) => {
        const { q } = c.req.valid('query');
        const found = await service.searchPlayers(q);

        return c.json({
          items: found.map((player) => ({
            id: player.id,
            name: player.name,
            country: player.country,
            avatarUrl: player.avatar,
            rank: player.stats.rank,
          })),
        });
      }
    )

    // GET /api/players/:id
    .get('/:id', validate('param', z.object({ id: playerId })), async (c) => {
      const { id } = c.req.valid('param');

      return c.json(await service.getOrSyncPlayer(id));
    })

    // GET /api/players/:id/scores?sort=recent&page=1&limit=20&search=text
    .get(
      '/:id/scores',
      validate('param', z.object({ id: playerId })),
      validate(
        'query',
        z.object({
          ...pagination,
          sort: z.enum(['recent', 'top']).default('recent'),
          search: z.string().trim().min(1).max(64).optional(),
        })
      ),
      async (c) => {
        const { id } = c.req.valid('param');
        const query = c.req.valid('query');
        const { items, total } = await service.listScores(id, query);

        return c.json(paginated(items, total, query));
      }
    )

    // POST /api/players/:id/sync
    .post(
      '/:id/sync',
      validate('param', z.object({ id: playerId })),
      async (c) => {
        const { id } = c.req.valid('param');

        return c.json(await service.syncPlayer(id));
      }
    );

export { createPlayersRoutes };
