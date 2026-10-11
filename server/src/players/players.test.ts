import { describe, expect, it } from 'vitest';

import { scoreEvents } from '../db/schema.ts';
import { api, app, database, scoreSaber } from '../testing/harness.ts';

const ALICE = '76561198000000002';

const json = async (response: Response) => (await response.json()) as never;

const sync = (playerId: string) =>
  api(`/api/players/${playerId}/sync`, { method: 'POST' });

describe('GET /api/health', () => {
  it('reports that the server and its database are up', async () => {
    // No session needed, so a monitoring service can call it
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

describe('POST /api/players/:id/sync', () => {
  it('stores the profile and all scores on the first sync', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
      { leaderboardId: 2, score: 700, playedAt: '2024-01-02T10:00:00.000Z' },
    ]);

    const response = await sync(ALICE);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      playerId: ALICE,
      firstSync: true,
      added: 2,
      improved: 0,
    });

    const scores = await api(`/api/players/${ALICE}/scores`);

    expect(await json(scores)).toMatchObject({
      total: 2,
      items: [
        { score: { modifiedScore: 700 }, leaderboard: { id: 2 } },
        { score: { modifiedScore: 500 }, leaderboard: { id: 1 } },
      ],
    });
  });

  it('asks only for scores since the newest stored one afterwards', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await sync(ALICE);
    scoreSaber.requests.length = 0;

    await sync(ALICE);

    expect(scoreSaber.requests).toHaveLength(1);
    expect(scoreSaber.requests[0]).toContain(
      `from=${encodeURIComponent('2024-01-01T10:00:00.000Z')}`
    );
  });

  it('logs a new and an improved score as news after the first sync', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await sync(ALICE);

    scoreSaber.setPlayer(ALICE, 'alice', [
      // Improved her score on leaderboard 1 ...
      { leaderboardId: 1, score: 650, playedAt: '2024-02-01T10:00:00.000Z' },
      // ... and played leaderboard 2 for the first time
      { leaderboardId: 2, score: 300, playedAt: '2024-02-02T10:00:00.000Z' },
    ]);

    const response = await sync(ALICE);

    expect(await response.json()).toEqual({
      playerId: ALICE,
      firstSync: false,
      added: 1,
      improved: 1,
    });

    const events = await database.db
      .select()
      .from(scoreEvents)
      .orderBy(scoreEvents.id);

    expect(events).toMatchObject([
      { leaderboardId: 1, previousScore: null, newScore: 500, isNews: false },
      { leaderboardId: 1, previousScore: 500, newScore: 650, isNews: true },
      { leaderboardId: 2, previousScore: null, newScore: 300, isNews: true },
    ]);
  });

  it('changes nothing when it runs again without new scores', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await sync(ALICE);

    const response = await sync(ALICE);

    expect(await response.json()).toMatchObject({ added: 0, improved: 0 });
    expect(await database.db.select().from(scoreEvents)).toHaveLength(1);
  });

  it('fetches every page of a player with many scores', async () => {
    const manyScores = Array.from({ length: 230 }, (_, index) => ({
      leaderboardId: index + 1,
      score: 1000 + index,
      playedAt: new Date(Date.UTC(2024, 0, 1, 0, index)).toISOString(),
    }));

    scoreSaber.setPlayer(ALICE, 'alice', manyScores);

    const response = await sync(ALICE);

    expect(await response.json()).toMatchObject({ added: 230 });
    expect(scoreSaber.requests).toHaveLength(3);
  });

  it('answers 404 for a player ScoreSaber does not know', async () => {
    const response = await sync('76561198999999999');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'not_found',
        message: 'ScoreSaber does not know this player',
      },
    });
  });

  it('answers 502 when ScoreSaber sends something unexpected', async () => {
    scoreSaber.breakProfile(ALICE, { id: ALICE, renamedField: 'alice' });

    const response = await sync(ALICE);

    expect(response.status).toBe(502);
    expect(await json(response)).toMatchObject({
      error: { code: 'scoresaber_unavailable' },
    });
  });
});

describe('GET /api/players/:id/scores', () => {
  const scores = [
    {
      leaderboardId: 1,
      score: 500,
      playedAt: '2024-01-03T10:00:00.000Z',
      songName: 'Monster',
    },
    {
      leaderboardId: 2,
      score: 900,
      playedAt: '2024-01-01T10:00:00.000Z',
      songName: 'Superstar',
    },
    {
      leaderboardId: 3,
      score: 700,
      playedAt: '2024-01-02T10:00:00.000Z',
      songName: '100% Monster_Remix',
    },
  ];

  const songNames = async (query: string) => {
    const response = await api(`/api/players/${ALICE}/scores?${query}`);
    const body: { items: { leaderboard: { songName: string } }[] } =
      await json(response);

    return body.items.map((item) => item.leaderboard.songName);
  };

  it('lists the latest scores first by default', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', scores);
    await sync(ALICE);

    expect(await songNames('')).toEqual([
      'Monster',
      '100% Monster_Remix',
      'Superstar',
    ]);
  });

  it('lists the highest scores first with sort=top', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', scores);
    await sync(ALICE);

    expect(await songNames('sort=top')).toEqual([
      'Superstar',
      '100% Monster_Remix',
      'Monster',
    ]);
  });

  it('searches the song name without regard to case', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', scores);
    await sync(ALICE);

    expect(await songNames('search=monster')).toEqual([
      'Monster',
      '100% Monster_Remix',
    ]);
  });

  it('takes % and _ in the search text literally', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', scores);
    await sync(ALICE);

    expect(await songNames('search=100%25')).toEqual(['100% Monster_Remix']);
    expect(await songNames('search=r_r')).toEqual(['100% Monster_Remix']);
  });

  it('splits the list into pages', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', scores);
    await sync(ALICE);

    const response = await api(`/api/players/${ALICE}/scores?limit=2&page=2`);

    expect(await json(response)).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      items: [{ leaderboard: { songName: 'Superstar' } }],
    });
  });

  it('rejects parameters that make no sense and names them', async () => {
    const response = await api('/api/players/not-an-id/scores?limit=500');

    expect(response.status).toBe(400);

    const first = await json(response);

    expect(first).toMatchObject({
      error: {
        code: 'validation_failed',
        details: [{ field: 'id' }],
      },
    });
  });
});

describe('GET /api/players/search', () => {
  it('finds players by name', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', []);
    scoreSaber.setPlayer('76561198000000003', 'bob', []);

    const response = await api('/api/players/search?q=ali');

    expect(await json(response)).toMatchObject({
      items: [{ id: ALICE, name: 'alice' }],
    });
  });

  it('wants at least three characters', async () => {
    const response = await api('/api/players/search?q=al');

    expect(response.status).toBe(400);
  });
});
