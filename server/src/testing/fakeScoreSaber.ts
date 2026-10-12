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
  /** ISO timestamp */
  playedAt: string;
  score: number;
  songName?: string;
};

// A real entry, used as the template for every fake one
const template = scoresFixture.data[0]!;

const toEntry = (
  { leaderboardId, playedAt, score, songName }: FakeScore,
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
    map: {
      ...template.leaderboard.map,
      hash: `HASH${leaderboardId}`,
      songName: songName ?? `Song ${leaderboardId}`,
    },
  },
});

const createFakeScoreSaber = () => {
  const players = new Map<string, { name: string; scores: FakeScore[] }>();
  const brokenProfiles = new Map<string, unknown>();
  const requests: string[] = [];

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
      const player = players.get(id);
      const url = new URL(c.req.url);

      requests.push(`${url.pathname}${url.search}`);

      if (player === undefined) return c.json(notFound(id), 404);

      const from = c.req.query('from');
      const page = Number(c.req.query('page') ?? 1);
      const limit = Number(c.req.query('limit') ?? 8);
      const matching = player.scores
        .filter((score) => from === undefined || score.playedAt >= from)
        .sort((a, b) => a.playedAt.localeCompare(b.playedAt));

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
    reset: () => {
      players.clear();
      brokenProfiles.clear();
      requests.length = 0;
    },
  };
};

export { createFakeScoreSaber, FAKE_SCORESABER_URL };
export type { FakeScore };
