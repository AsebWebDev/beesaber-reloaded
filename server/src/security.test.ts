import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { MAX_HIVE_SIZE } from './hive/hive.service.ts';
import {
  api,
  app,
  APP_URL,
  createTestApp,
  createUser,
  database,
  linkProfile,
  ME,
  scoreSaber,
} from './testing/harness.ts';

/**
 * Tests that play the attacker: each one tries something a hostile visitor
 * could try and checks that it gets nowhere.
 */

const json = async (response: Response) => (await response.json()) as never;

const postJson = (path: string, body: unknown, as = api) =>
  as(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const tableExists = async (name: string) => {
  const rows = await database.db.execute(
    sql`select 1 from information_schema.tables where table_name = ${name}`
  );

  return rows.length === 1;
};

describe('SQL injection', () => {
  const ATTACK = `'; drop table scores; --`;

  it('treats SQL in the search text as text', async () => {
    scoreSaber.setPlayer(ME, 'me', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await linkProfile(ME);

    const response = await api(
      `/api/players/${ME}/scores?search=${encodeURIComponent(ATTACK)}`
    );

    // A normal answer: no song is called like the attack
    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({ total: 0, items: [] });
    expect(await tableExists('scores')).toBe(true);

    // And the data is still there
    const all = await api(`/api/players/${ME}/scores`);

    expect(await json(all)).toMatchObject({ total: 1 });
  });

  it('finds a song whose name really contains a quote', async () => {
    scoreSaber.setPlayer(ME, 'me', [
      {
        leaderboardId: 1,
        score: 500,
        playedAt: '2024-01-01T10:00:00.000Z',
        songName: "Don't Stop",
      },
    ]);
    await linkProfile(ME);

    const response = await api(
      `/api/players/${ME}/scores?search=${encodeURIComponent("don't")}`
    );

    expect(await json(response)).toMatchObject({ total: 1 });
  });

  it('rejects SQL in place of a player id in the path', async () => {
    const response = await api(
      `/api/players/${encodeURIComponent("1' or '1'='1")}/scores`
    );

    expect(response.status).toBe(400);
  });

  it('rejects SQL in place of a player id in the body', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await postJson('/api/hive', { playerId: ATTACK });

    expect(response.status).toBe(400);
    expect(await tableExists('scores')).toBe(true);
  });

  it('rejects a player id that is not a string', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await postJson('/api/hive', {
      playerId: { $ne: null },
    });

    expect(response.status).toBe(400);
  });
});

describe('requests from other websites', () => {
  it('refuses a form sent from a foreign site', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await api('/api/hive/sync', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://evil.example',
      },
      body: '',
    });

    expect(response.status).toBe(403);
  });

  it('accepts the same form from our own frontend', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await api('/api/hive/sync', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: APP_URL,
      },
      body: '',
    });

    expect(response.status).toBe(200);
  });

  it('sends no headers that would let other sites read the answers', async () => {
    const response = await api('/api/me', {
      headers: { origin: 'https://evil.example' },
    });

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('response headers', () => {
  it('tells browsers to be strict', async () => {
    const response = await app.request('/api/health');

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('strict-transport-security')).toContain(
      'max-age'
    );
    expect(response.headers.get('x-powered-by')).toBeNull();
  });
});

describe('oversized and malformed requests', () => {
  it('refuses a body that is far larger than anything the API accepts', async () => {
    const response = await postJson('/api/hive', {
      playerId: '1',
      padding: 'x'.repeat(200 * 1024),
    });

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: { code: 'validation_failed' },
    });
  });

  it('answers a broken JSON body with 400 instead of crashing', async () => {
    const response = await api('/api/hive', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"playerId": ',
    });

    expect(response.status).toBe(400);
  });

  it('does not reveal internals in error answers', async () => {
    const response = await api('/api/players/76561198999999999');
    const body: { error: Record<string, unknown> } = await json(response);

    expect(Object.keys(body.error).sort()).toEqual(['code', 'message']);
    expect(JSON.stringify(body)).not.toMatch(/stack|node_modules|select /i);
  });
});

describe('flooding', () => {
  it('stops an account after too many requests and says when to return', async () => {
    const limited = createTestApp({ requestsPerMinute: 3 });
    const user = await createUser('flooder', limited);

    for (let request = 0; request < 3; request++)
      expect((await user('/api/me')).status).toBe(200);

    const blocked = await user('/api/me');

    expect(blocked.status).toBe(429);
    expect(await json(blocked)).toMatchObject({
      error: { code: 'rate_limited' },
    });
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('counts every account on its own', async () => {
    const limited = createTestApp({ requestsPerMinute: 1 });
    const first = await createUser('first', limited);
    const second = await createUser('second', limited);

    await first('/api/me');

    expect((await first('/api/me')).status).toBe(429);
    expect((await second('/api/me')).status).toBe(200);
  });

  it('does not ask ScoreSaber again when a player was just synced', async () => {
    const strict = createTestApp({ minSyncIntervalMs: 60_000 });
    const user = await createUser('syncer', strict);

    scoreSaber.setPlayer(ME, 'me', []);
    await user(`/api/players/${ME}/sync`, { method: 'POST' });
    scoreSaber.requests.length = 0;

    const again = await user(`/api/players/${ME}/sync`, { method: 'POST' });

    expect(await json(again)).toMatchObject({ skipped: true });
    expect(scoreSaber.requests).toHaveLength(0);
  });

  it('limits how many bees a hive can have', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const idOf = (index: number) => String(76561198100000000n + BigInt(index));

    for (let index = 0; index <= MAX_HIVE_SIZE; index++)
      scoreSaber.setPlayer(idOf(index), `bee ${index}`, []);

    for (let index = 0; index < MAX_HIVE_SIZE; index++)
      expect(
        (await postJson('/api/hive', { playerId: idOf(index) })).status
      ).toBe(201);

    const oneTooMany = await postJson('/api/hive', {
      playerId: idOf(MAX_HIVE_SIZE),
    });

    expect(oneTooMany.status).toBe(400);

    // Adding someone who is already in is still fine
    const again = await postJson('/api/hive', { playerId: idOf(0) });

    expect(again.status).toBe(201);
  });
});

describe('other people’s data', () => {
  it('cannot be reached by guessing: the hive routes take no user id', async () => {
    const BEE = '76561198000000002';
    const other = await createUser('other-user');

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    await linkProfile(ME);
    await linkProfile(ME, other);
    await postJson('/api/hive', { playerId: BEE });

    // The other account cannot remove my bee ...
    const removal = await other(`/api/hive/${BEE}`, { method: 'DELETE' });

    expect(removal.status).toBe(404);

    // ... and my hive is untouched
    const mine: { items: unknown[] } = await json(await api('/api/hive'));

    expect(mine.items).toHaveLength(1);
  });
});
