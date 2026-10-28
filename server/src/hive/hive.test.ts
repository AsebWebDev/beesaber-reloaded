import { beforeEach, describe, expect, it } from 'vitest';

import {
  api,
  app,
  createUser,
  linkProfile,
  ME,
  scoreSaber,
  services,
} from '../testing/harness.ts';

const BEE = '76561198000000002';
const STRANGER = '76561198000000003';

/**
 * A moment shortly after now. News only counts scores set after the bee
 * joined the hive, which in a test is "now".
 */
const soon = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const json = async (response: Response) => (await response.json()) as never;

const addToHive = (playerId: string, as = api) =>
  as('/api/hive', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });

const sync = (playerId: string) =>
  services.playersService.requestSync(playerId);

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
  it('adds a player and has their scores fetched', async () => {
    const response = await addToHive(BEE);

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      player: { id: BEE, name: 'bee' },
    });
    expect(await json(await api(`/api/players/${BEE}/scores`))).toMatchObject({
      total: 3,
    });
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
      error: { code: 'cannot_add_self' },
    });
  });

  it('answers 404 for a player ScoreSaber does not know', async () => {
    const response = await addToHive('76561198999999999');

    expect(response.status).toBe(404);
    // The frontend picks its text by this code
    expect(await json(response)).toMatchObject({
      error: { code: 'unknown_player' },
    });
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
    // The frontend picks its text by this code
    expect(await json(response)).toMatchObject({
      error: { code: 'not_in_hive' },
    });
  });
});

describe('GET /api/hive/news', () => {
  type News = {
    items: {
      event: { newScore: number; previousScore: number | null };
      leaderboard: { id: number };
      myScore: number;
      theirScore: number;
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
      { leaderboardId: 1, score: 950, playedAt: soon(1) },
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
      { leaderboardId: 3, score: 650, playedAt: soon(1) },
    ]);
    await sync(BEE);

    expect((await news()).items).toMatchObject([
      { leaderboard: { id: 3 }, event: { previousScore: null }, myScore: 600 },
    ]);
  });

  it('does not report what a bee did before joining my hive', async () => {
    // Someone else has had the bee in their hive for a long time, so her
    // scores have been logged all along
    const other = await createUser('other-user');

    scoreSaber.setPlayer(STRANGER, 'other', []);
    await linkProfile(STRANGER, other);
    await addToHive(BEE, other);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 950, playedAt: '2024-01-10T10:00:00.000Z' },
    ]);
    await sync(BEE);

    // Now she joins my hive. She is ahead of me on leaderboard 1, but that
    // happened before I knew her.
    await addToHive(BEE);

    expect((await news()).items).toEqual([]);
  });

  it('shows what the bee holds now when she improved again after passing me', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 950, playedAt: soon(1) },
    ]);
    await sync(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 980, playedAt: soon(2) },
    ]);
    await sync(BEE);

    const { items } = await news();

    // One report, for the score that took her past me, with her current score
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      event: { previousScore: 800, newScore: 950 },
      myScore: 900,
      theirScore: 980,
    });
  });

  it('stays quiet when a bee improves but remains behind me', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 850, playedAt: soon(1) },
    ]);
    await sync(BEE);

    expect((await news()).items).toEqual([]);
  });

  it('stays quiet when a bee extends a lead she already had', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 2, score: 550, playedAt: soon(1) },
    ]);
    await sync(BEE);

    expect((await news()).items).toEqual([]);
  });

  it('drops the report once I have taken the lead back', async () => {
    await addToHive(BEE);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 950, playedAt: soon(1) },
    ]);
    await sync(BEE);
    scoreSaber.setPlayer(ME, 'me', [
      { leaderboardId: 1, score: 990, playedAt: soon(2) },
    ]);
    await sync(ME);

    expect((await news()).items).toEqual([]);
  });

  it('ignores players who are not in my hive', async () => {
    scoreSaber.setPlayer(STRANGER, 'stranger', []);
    await sync(ME);
    await sync(STRANGER);
    scoreSaber.setPlayer(STRANGER, 'stranger', [
      { leaderboardId: 1, score: 999, playedAt: soon(1) },
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
    // The frontend picks its text by this code
    expect(await json(response)).toMatchObject({
      error: { code: 'not_in_hive' },
    });
  });
});

describe('POST /api/hive/sync', () => {
  it('asks for new scores of me and every bee', async () => {
    await addToHive(BEE);
    scoreSaber.requests.length = 0;

    const response = await api('/api/hive/sync', { method: 'POST' });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ queued: 2, upToDate: 0 });
    // One request for scores per player
    expect(scoreSaber.requests).toHaveLength(2);
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

describe('who can be in a hive', () => {
  it('takes a bee out of my hive when I pick her profile as mine', async () => {
    await addToHive(BEE);

    await linkProfile(BEE);

    const hive: { items: unknown[] } = await json(await api('/api/hive'));

    expect(hive.items).toEqual([]);
  });

  it('holds the size limit when several bees are added at the same moment', async () => {
    const idOf = (index: number) => String(76561198200000000n + BigInt(index));

    for (let index = 0; index < 53; index++)
      scoreSaber.setPlayer(idOf(index), `bee ${index}`, []);
    // One place left
    for (let index = 0; index < 49; index++) await addToHive(idOf(index));

    const responses = await Promise.all(
      [49, 50, 51, 52].map(async (index) => addToHive(idOf(index)))
    );
    const hive: { items: unknown[] } = await json(await api('/api/hive'));

    expect(hive.items).toHaveLength(50);
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 400, 400, 400,
    ]);
  });
});

describe('GET /api/hive/maps/:leaderboardId', () => {
  type Ranking = {
    entries: {
      isMe: boolean;
      place: number;
      player: { id: string };
      score: { modifiedScore: number };
    }[];
    leaderboard: { id: number; songName: string };
  };

  const ranking = async (leaderboardId: number | string, as = api) =>
    as(`/api/hive/maps/${leaderboardId}`);

  it('lists me and my bees who played the map, best first', async () => {
    await addToHive(BEE);

    const response = await ranking(2);

    expect(response.status).toBe(200);

    const body: Ranking = await json(response);

    expect(body.leaderboard).toMatchObject({ id: 2, songName: 'Song 2' });
    expect(
      body.entries.map(({ isMe, place, player, score }) => [
        place,
        player.id,
        score.modifiedScore,
        isMe,
      ])
    ).toEqual([
      [1, BEE, 500, false],
      [2, ME, 400, true],
    ]);
  });

  it('leaves out bees who have not played it, and players of other hives', async () => {
    const other = await createUser('other-user');

    scoreSaber.setPlayer(STRANGER, 'stranger', [
      { leaderboardId: 3, score: 999, playedAt: '2024-01-07T10:00:00.000Z' },
    ]);
    await linkProfile(STRANGER, other);
    await addToHive(BEE);

    // The bee has no score on 3, the stranger is in no hive of mine
    const body: Ranking = await json(await ranking(3));

    expect(body.entries.map(({ player }) => player.id)).toEqual([ME]);
  });

  it('gives the same place to the same score', async () => {
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 900, playedAt: '2024-01-04T10:00:00.000Z' },
    ]);
    await addToHive(BEE);

    const body: Ranking = await json(await ranking(1));

    // I got there first, so I am listed first
    expect(body.entries.map(({ place, player }) => [place, player.id])).toEqual(
      [
        [1, ME],
        [1, BEE],
      ]
    );
  });

  it('shows a known map that nobody in my hive has played, empty', async () => {
    // Leaderboard 4 is known from the bee, who is not in my hive
    await sync(BEE);

    const response = await ranking(4);

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({
      leaderboard: { id: 4 },
      entries: [],
    });
  });

  it('answers 404 for a map nobody tracked here has played', async () => {
    const response = await ranking(999_999);

    expect(response.status).toBe(404);
    expect(await json(response)).toMatchObject({
      error: { code: 'unknown_map' },
    });
  });

  it.each(['abc', '0', '3000000000'])(
    'rejects %s, which cannot be a map',
    async (id) => {
      const response = await ranking(id);

      expect(response.status).toBe(400);
      expect(await json(response)).toMatchObject({
        error: { code: 'validation_failed' },
      });
    }
  );
});
