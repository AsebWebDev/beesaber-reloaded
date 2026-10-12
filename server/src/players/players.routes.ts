import { Hono } from 'hono';
import { z } from 'zod';

import { paginated, pagination, playerId, validate } from '../http/validate.ts';

import type { MiddlewareHandler } from 'hono';
import type { UserEnv } from '../http/session.ts';
import type { PlayersService } from './players.service.ts';

/**
 * The HTTP side of players: read the request, call the service, shape the
 * answer. No rules and no SQL in here.
 *
 * There is deliberately no route to look up or sync an arbitrary player by
 * id. Both would let any account make the server fetch any number of players
 * from ScoreSaber. Players enter the system only by being picked as a profile
 * or added to a hive, and both of those are limited.
 */
const createPlayersRoutes = (
  service: PlayersService,
  searchLimit: MiddlewareHandler<UserEnv>
) =>
  new Hono<UserEnv>()
    // GET /api/players/search?q=name
    .get(
      '/search',
      searchLimit,
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

    // GET /api/players/:id/scores?sort=recent&page=1&limit=20&search=text
    // Reads what is stored. For a player we do not know, the list is empty.
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
    );

export { createPlayersRoutes };
