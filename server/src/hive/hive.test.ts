import { beforeEach, describe, expect, it } from 'vitest';

import {
  api,
  app,
  createUser,
  linkProfile,
  ME,
  scoreSaber,
} from '../testing/harness.ts';

const BEE = '76561198000000002';
const STRANGER = '76561198000000003';

const json = async (response: Response) => (await response.json()) as never;

const addToHive = (playerId: string, as = api) =>
  as('/api/hive', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });

const sync = (playerId: string) =>
  api(`/api/players/${playerId}/sync`, { method: 'POST' });

beforeEach(async () => {
  // I am ahead on leaderboard 1, behind on 2, and alone on 3
  scoreSaber.setPlayer(ME, 'me', [
    { leaderboardId: 1, score: 900, playedAt: '2024-01-01T10:00:00.000Z' },
    { leaderboardId: 2, score: 400, playedAt: '2024-01-02T10:00:00.000Z' },
    { leaderboardId: 3, score: 600, playedAt: '2024-01-03T10:00:00.000Z' },
  ]);
  // The bee is alone on leaderboard 4
  scoreSaber.setPlayer(BEE, 'bee', [
    { leaderboardId: 1, score: 800, playedAt: '2024-01-04T10:00:00.000Z' },
    { leaderboardId: 2, score: 500, playedAt: '2024-01-05T10:00:00.000Z' },
    { leaderboardId: 4, score: 700, playedAt: '2024-01-06T10:00:00.000Z' },
  ]);

  await linkProfile(ME);
});

describe('POST /api/hive', () => {
  it('adds a player and fetches their scores right away', async () => {
    const response = await addToHive(BEE);

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ playerId: BEE, added: 3 });
  });

  it('accepts the same player twice without doubling them', async () => {
    await addToHive(BEE);
    await addToHive(BEE);

    const hive = await api('/api/hive');
    const body: { items: unknown[] } = await json(hive);

    expect(body.items).toHaveLength(1);
  });

  it('refuses to add myself', async () => {
    const response = await addToHive(ME);

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: { code: 'validation_failed' },
    });
  });

  it('answers 404 for a player ScoreSaber does not know', async () => {
    const response = await addToHive('76561198999999999');

    expect(response.status).toBe(404);
  });

  it('rejects a body without a player id', async () => {
    const response = await api('/api/hive', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/hive', () => {
  it('is empty at first', async () => {
    const response = await api('/api/hive');

    expect(await response.json()).toEqual({ items: [] });
  });

  it('lists the bees with the head-to-head record', async () => {
    await addToHive(BEE);

    const response = await api('/api/hive');

    expect(await json(response)).toMatchObject({
      items: [
        {
          player: { id: BEE, name: 'bee' },
          shared: 2,
          winning: 1,
          losing: 1,
        },
      ],
    });
  });

  it('shows zeros for a bee without any scores', async () => {
    scoreSaber.setPlayer(BEE, 'bee', []);
    await addToHive(BEE);

    const response = await api('/api/hive');

    expect(await json(response)).toMatchObject({
      items: [{ player: { id: BEE }, shared: 0, winning: 0, losing: 0 }],
    });
  });
});

describe('GET /api/hive/:playerId/comparison', () => {
  type Comparison = {
    items: {
      leaderboard: { id: number };
      mine: { modifiedScore: number };
      theirs: { modifiedScore: number };
    }[];
    total: number;
  };

  const compare = async (query = ''): Promise<Comparison> =>
    json(await api(`/api/hive/${BEE}/comparison?${query}`));

  it('lists only the leaderboards both have played', async () => {
    await addToHive(BEE);

    const { items, total } = await compare();

    expect(total).toBe(2);
    expect(items.map((item) => item.leaderboard.id)).toEqual([2, 1]);
    expect(items[0]).toMatchObject({
      mine: { modifiedScore: 400 },
      theirs: { modifiedScore: 500 },
    });
  });

  it('narrows the list to where I am behind', async () => {
    await addToHive(BEE);

    const { items, total } = await compare('filter=losing');

    expect(total).toBe(1);
    expect(items.map((item) => item.leaderboard.id)).toEqual([2]);
  });

  it('narrows the list to where I am ahead', async () => {
    await addToHive(BEE);

    const { items } = await compare('filter=winning');

    expect(items.map((item) => item.leaderboard.id)).toEqual([1]);
  });

  it('answers 404 for a player who is not in my hive', async () => {
    scoreSaber.setPlayer(STRANGER, 'stranger', []);
    await sync(STRANGER);

    const response = await api(`/api/hive/${STRANGER}/comparison`);

    expect(response.status).toBe(404);
  });
});

describe('GET /api/hive/news', () => {
  type News = {
    items: {
      event: { newScore: number; previousScore: number | null };
      leaderboard: { id: number };
      myScore: number;
      player: { name: string };
    }[];
  };

  const news = async (): Promise<News> => json(await api('/api/hive/news'));

  it('has nothing to report right after adding a bee', async () => {
    await addToHive(BEE);

    // The bee is ahead on leaderboard 2, but that happened before she joined
    expect((await news()).items).toEqual([]);
  });

  it('reports when a bee goes past my score', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 950, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await sync(BEE);

    expect((await news()).items).toMatchObject([
      {
        player: { name: 'bee' },
        leaderboard: { id: 1 },
        event: { previousScore: 800, newScore: 950 },
        myScore: 900,
      },
    ]);
  });

  it('reports a first score of a bee that is higher than mine', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 3, score: 650, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await sync(BEE);

    expect((await news()).items).toMatchObject([
      { leaderboard: { id: 3 }, event: { previousScore: null }, myScore: 600 },
    ]);
  });

  it('stays quiet when a bee improves but remains behind me', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 850, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await sync(BEE);

    expect((await news()).items).toEqual([]);
  });

  it('stays quiet when a bee extends a lead she already had', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 2, score: 550, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await sync(BEE);

    expect((await news()).items).toEqual([]);
  });

  it('drops the report once I have taken the lead back', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 950, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await sync(BEE);
    scoreSaber.setPlayer(ME, 'me', [
      { leaderboardId: 1, score: 990, playedAt: '2024-02-02T10:00:00.000Z' },
    ]);
    await sync(ME);

    expect((await news()).items).toEqual([]);
  });

  it('ignores players who are not in my hive', async () => {
    scoreSaber.setPlayer(STRANGER, 'stranger', []);
    await sync(ME);
    await sync(STRANGER);
    scoreSaber.setPlayer(STRANGER, 'stranger', [
      { leaderboardId: 1, score: 999, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await sync(STRANGER);

    expect((await news()).items).toEqual([]);
  });
});

describe('DELETE /api/hive/:playerId', () => {
  it('removes a bee from the hive', async () => {
    await addToHive(BEE);

    const response = await api(`/api/hive/${BEE}`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
    expect(await (await api('/api/hive')).json()).toEqual({
      items: [],
    });
  });

  it('answers 404 when the player was not in the hive', async () => {
    const response = await api(`/api/hive/${BEE}`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(404);
  });
});

describe('POST /api/hive/sync', () => {
  it('brings me and every bee up to date', async () => {
    await addToHive(BEE);

    const response = await api('/api/hive/sync', { method: 'POST' });
    const body: { items: { playerId: string }[] } = await json(response);

    expect(body.items.map((item) => item.playerId)).toEqual([ME, BEE]);
  });
});

describe('who may use the hive', () => {
  it('answers 401 without a session', async () => {
    const response = await app.request('/api/hive');

    expect(response.status).toBe(401);
    expect(await json(response)).toMatchObject({
      error: { code: 'unauthorized' },
    });
  });

  it('answers 409 until the user has picked a ScoreSaber profile', async () => {
    const newcomer = await createUser('newcomer');

    const response = await newcomer('/api/hive');

    expect(response.status).toBe(409);
    expect(await json(response)).toMatchObject({
      error: { code: 'no_player_linked' },
    });
  });

  it('keeps the hives of two accounts apart, even with the same profile', async () => {
    const other = await createUser('other-user');

    await linkProfile(ME, other);
    await addToHive(BEE);

    const mine: { items: unknown[] } = await json(await api('/api/hive'));
    const theirs: { items: unknown[] } = await json(await other('/api/hive'));

    expect(mine.items).toHaveLength(1);
    expect(theirs.items).toHaveLength(0);
  });
});
