import { describe, expect, it } from 'vitest';

import { scoreEvents } from '../db/schema.ts';
import {
  api,
  app,
  database,
  linkProfile,
  scoreSaber,
  services,
} from '../testing/harness.ts';

const ALICE = '76561198000000002';

const json = async (response: Response) => (await response.json()) as never;

/** Asks for a sync, the way picking a profile or adding a bee does */
const sync = (playerId: string) =>
  services.playersService.requestSync(playerId);

describe('GET /api/health', () => {
  it('reports that the server and its database are up', async () => {
    // No session needed, so a monitoring service can call it
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

describe('syncing a player', () => {
  it('stores the profile and all scores on the first sync', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
      { leaderboardId: 2, score: 700, playedAt: '2024-01-02T10:00:00.000Z' },
    ]);

    expect(await sync(ALICE)).toEqual({ queued: true });

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

  it('logs new and improved scores once the first sync is done, but not the first sync itself', async () => {
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

    await sync(ALICE);

    const events = await database.db
      .select()
      .from(scoreEvents)
      .orderBy(scoreEvents.id);

    // Nothing for the 500 of the first sync: that was history
    expect(events).toMatchObject([
      { leaderboardId: 1, previousScore: 500, newScore: 650 },
      { leaderboardId: 2, previousScore: null, newScore: 300 },
    ]);
  });

  it('changes nothing when it runs again without new scores', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await sync(ALICE);

    await sync(ALICE);

    expect(await database.db.select().from(scoreEvents)).toHaveLength(0);
  });

  it('fetches every page of a player with many scores', async () => {
    const manyScores = Array.from({ length: 230 }, (_, index) => ({
      leaderboardId: index + 1,
      score: 1000 + index,
      playedAt: new Date(Date.UTC(2024, 0, 1, 0, index)).toISOString(),
    }));

    scoreSaber.setPlayer(ALICE, 'alice', manyScores);

    await sync(ALICE);

    expect(scoreSaber.requests).toHaveLength(3);
    expect(
      await json(await api(`/api/players/${ALICE}/scores?limit=1`))
    ).toMatchObject({ total: 230 });
  });

  it('does not lose a score when the list changes between two pages', async () => {
    const minute = (n: number) =>
      new Date(Date.UTC(2024, 0, 1, 0, n)).toISOString();
    const scores = Array.from({ length: 150 }, (_, index) => ({
      leaderboardId: index + 1,
      score: 1000,
      playedAt: minute(index),
    }));

    scoreSaber.setPlayer(ALICE, 'alice', scores);
    // While we read page one, Alice improves her oldest score. In a list
    // sorted by time it moves to the end, and every score behind it moves up
    // by one: what was first on page two is now last on page one.
    scoreSaber.onScoresRequest((count) => {
      if (count === 2)
        scoreSaber.setPlayer(ALICE, 'alice', [
          ...scores.slice(1),
          { leaderboardId: 1, score: 2000, playedAt: minute(500) },
        ]);
    });

    await sync(ALICE);

    const all: { total: number } = await json(
      await api(`/api/players/${ALICE}/scores?limit=1&sort=top`)
    );

    expect(all.total).toBe(150);
    expect(all).toMatchObject({
      items: [{ leaderboard: { id: 1 }, score: { modifiedScore: 2000 } }],
    });
  });

  it('logs a score once when two syncs of the same player overlap', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await sync(ALICE);
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 650, playedAt: '2024-02-01T10:00:00.000Z' },
      { leaderboardId: 2, score: 300, playedAt: '2024-02-02T10:00:00.000Z' },
    ]);

    await Promise.all([
      services.playersService.runSync(ALICE),
      services.playersService.runSync(ALICE),
      services.playersService.runSync(ALICE),
    ]);

    expect(await database.db.select().from(scoreEvents)).toHaveLength(2);
  });

  it('keeps the best score when ScoreSaber sends two plays of one map', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 700, playedAt: '2024-01-01T10:00:00.000Z' },
      { leaderboardId: 1, score: 500, playedAt: '2024-01-02T10:00:00.000Z' },
    ]);

    await sync(ALICE);

    expect(await json(await api(`/api/players/${ALICE}/scores`))).toMatchObject(
      { total: 1, items: [{ score: { modifiedScore: 700 } }] }
    );
  });

  it('never replaces a stored score with a worse one', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 700, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await sync(ALICE);
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 400, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);

    await sync(ALICE);

    expect(await json(await api(`/api/players/${ALICE}/scores`))).toMatchObject(
      { total: 1, items: [{ score: { modifiedScore: 700 } }] }
    );
    expect(await database.db.select().from(scoreEvents)).toHaveLength(0);
  });

  it('answers 404 when the profile picked is unknown to ScoreSaber', async () => {
    const response = await linkProfile('76561198999999999');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: 'unknown_player',
        message: 'ScoreSaber does not know this player',
      },
    });
  });

  it('answers 502 when ScoreSaber sends something unexpected', async () => {
    const logged: unknown[] = [];
    // The server logs what was wrong with the answer. Catch the log, so it
    // can be checked here instead of cluttering the test output.
    const original = console.error;

    console.error = (...args: unknown[]) => logged.push(args[0]);

    try {
      scoreSaber.breakProfile(ALICE, { id: ALICE, renamedField: 'alice' });

      const response = await linkProfile(ALICE);
      const body = JSON.stringify(await json(response));

      expect(response.status).toBe(502);
      expect(body).toContain('scoresaber_unavailable');
      // The details go to the log, not to the caller
      expect(body).not.toContain('renamedField');
      expect(String(logged[0])).toContain('does not look as expected');
    } finally {
      console.error = original;
    }
  });
});

describe('routes that would let anyone fetch any player', () => {
  it('do not exist: no sync by id', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', []);

    const response = await api(`/api/players/${ALICE}/sync`, {
      method: 'POST',
    });

    expect(response.status).toBe(404);
    expect(scoreSaber.requests).toHaveLength(0);
  });

  it('do not exist: no lookup by id', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', []);

    const response = await api(`/api/players/${ALICE}`);

    expect(response.status).toBe(404);
  });

  it('leave the scores of an unknown player empty instead of fetching them', async () => {
    scoreSaber.setPlayer(ALICE, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);

    const response = await api(`/api/players/${ALICE}/scores`);

    expect(await json(response)).toMatchObject({ total: 0, items: [] });
    expect(scoreSaber.requests).toHaveLength(0);
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

describe('GET /api/config', () => {
  it('tells everyone which ways to sign in are switched on', async () => {
    const response = await app.request('/api/config');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      signIn: { devLogin: true, google: false },
    });
  });
});
