import { Hono } from 'hono';

import playerFixture from './fixtures/player.json' with { type: 'json' };
import scoresFixture from './fixtures/scores-page.json' with { type: 'json' };

/**
 * A stand-in for ScoreSaber in tests: a small Hono app that answers the same
 * URLs with the same shapes, built from real answers stored in ./fixtures,
 * but with players and scores the test chooses.
 *
 * Nothing goes over the network. The ScoreSaber client is handed this app's
 * `fetch` function instead of the real one.
 */

const FAKE_SCORESABER_URL = 'https://scoresaber.test';

type FakeScore = {
  leaderboardId: number;
  /**
   * The map's maximum score. The real answer the fake is built from has 0,
   * as ScoreSaber sends for some unranked maps, and so does every fake map
   * unless a test sets one.
   */
  maxScore?: number;
  /** ISO timestamp */
  playedAt: string;
  score: number;
  songName?: string;
};

// A real entry, used as the template for every fake one
const template = scoresFixture.data[0]!;

const toEntry = (
  { leaderboardId, maxScore, playedAt, score, songName }: FakeScore,
  index: number
) => ({
  score: {
    ...template.score,
    id: leaderboardId * 1000 + index,
    modifiedScore: score,
    unmodifiedScore: score,
    createdAt: playedAt,
  },
  leaderboard: {
    ...template.leaderboard,
    id: leaderboardId,
    maxScore: maxScore ?? template.leaderboard.maxScore,
    map: {
      ...template.leaderboard.map,
      hash: `HASH${leaderboardId}`,
      songName: songName ?? `Song ${leaderboardId}`,
    },
  },
});

/**
 * The orders ScoreSaber sorts a player's scores in, as far as BeeSaber asks
 * for them. Without `sort`, ScoreSaber's API sorts by "top".
 */
const SORTS: Record<string, (a: FakeScore, b: FakeScore) => number> = {
  oldest: (a, b) => a.playedAt.localeCompare(b.playedAt),
  recent: (a, b) => b.playedAt.localeCompare(a.playedAt),
  top: (a, b) => b.score - a.score,
};

const createFakeScoreSaber = () => {
  const players = new Map<string, { name: string; scores: FakeScore[] }>();
  const brokenProfiles = new Map<string, unknown>();
  const requests: string[] = [];
  let beforeScoresRequest: ((count: number) => void) | undefined;

  const notFound = (id: string) => ({
    statusCode: 404,
    error: 'Not Found',
    code: 'NOT_FOUND',
    message: `Connection not found: ${id}`,
  });

  const app = new Hono()
    .basePath('/api/v2')
    .get('/players', (c) => {
      const search = c.req.query('search') ?? '';
      const data = [...players]
        .filter(([, player]) => player.name.includes(search))
        .map(([id, player]) => ({ ...playerFixture, id, name: player.name }));

      return c.json({
        data,
        metadata: {
          page: 1,
          itemsPerPage: 20,
          totalItems: data.length,
          totalPages: 1,
        },
      });
    })
    .get('/players/:id', (c) => {
      const id = c.req.param('id');
      const player = players.get(id);

      if (brokenProfiles.has(id)) return c.json(brokenProfiles.get(id));
      if (player === undefined) return c.json(notFound(id), 404);

      return c.json({ ...playerFixture, id, name: player.name });
    })
    .get('/players/:id/scores', (c) => {
      const id = c.req.param('id');
      const url = new URL(c.req.url);

      requests.push(`${url.pathname}${url.search}`);
      // The hook may change the player's scores, so it runs before they are read
      beforeScoresRequest?.(requests.length);

      const player = players.get(id);

      if (player === undefined) return c.json(notFound(id), 404);

      const from = c.req.query('from');
      const page = Number(c.req.query('page') ?? 1);
      const limit = Number(c.req.query('limit') ?? 8);
      const order = SORTS[c.req.query('sort') ?? 'top'];

      // An order the fake does not know is a mistake in the code under
      // test, not something to answer with an order it did not ask for
      if (order === undefined)
        return c.json({ message: 'Unknown sort order' }, 400);

      const matching = player.scores
        .filter((score) => from === undefined || score.playedAt >= from)
        .sort(order);

      return c.json({
        data: matching
          .slice((page - 1) * limit, page * limit)
          .map((score, index) => toEntry(score, index)),
        metadata: {
          page,
          itemsPerPage: limit,
          totalItems: matching.length,
          totalPages: Math.ceil(matching.length / limit),
        },
      });
    });

  // Same signature as the global `fetch`
  const fakeFetch: typeof fetch = (input, init) =>
    Promise.resolve(app.fetch(new Request(input, init)));

  return {
    fetch: fakeFetch,
    /** Makes the profile of this player come back as the given JSON */
    breakProfile: (id: string, body: unknown) => {
      brokenProfiles.set(id, body);
    },
    /** Adds a player, or replaces their scores */
    setPlayer: (id: string, name: string, scores: FakeScore[]) => {
      players.set(id, { name, scores });
    },
    /** Score requests the fake has seen, as path and query string */
    requests,
    /**
     * Calls `hook` at the start of every score request, with the number of
     * that request. Lets a test change a player's scores between two pages.
     */
    onScoresRequest: (hook: (count: number) => void) => {
      beforeScoresRequest = hook;
    },
    reset: () => {
      beforeScoresRequest = undefined;
      players.clear();
      brokenProfiles.clear();
      requests.length = 0;
    },
  };
};

export { createFakeScoreSaber, FAKE_SCORESABER_URL };
export type { FakeScore };
