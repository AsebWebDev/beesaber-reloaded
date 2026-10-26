import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { MAX_HIVE_SIZE } from './hive/hive.service.ts';
import {
  api,
  app,
  APP_URL,
  createManualQueue,
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

  it('refuses to delete an account on behalf of a foreign site', async () => {
    const response = await api('/api/me', {
      method: 'DELETE',
      headers: { origin: 'https://evil.example' },
    });

    expect(response.status).toBe(403);
    expect((await api('/api/me')).status).toBe(200);
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

    expect(response.status).toBe(202);
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
    const response = await linkProfile('76561198999999999');
    const body: { error: Record<string, unknown> } = await json(response);

    expect(Object.keys(body.error).sort()).toEqual(['code', 'message']);
    expect(JSON.stringify(body)).not.toMatch(/stack|node_modules|select /i);
  });
});

describe('flooding', () => {
  it('stops an account after too many requests and says when to return', async () => {
    const limited = createTestApp({ limits: { perMinute: 3 } }).app;
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
    const limited = createTestApp({ limits: { perMinute: 1 } }).app;
    const first = await createUser('first', limited);
    const second = await createUser('second', limited);

    await first('/api/me');

    expect((await first('/api/me')).status).toBe(429);
    expect((await second('/api/me')).status).toBe(200);
  });

  it('does not ask ScoreSaber again when a player was just synced', async () => {
    const strict = createTestApp({ minSyncIntervalMs: 60_000 }).app;
    const user = await createUser('syncer', strict);

    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME, user);
    scoreSaber.requests.length = 0;

    const again = await user('/api/hive/sync', { method: 'POST' });

    expect(await json(again)).toEqual({ queued: 0, upToDate: 1 });
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
    // With the limit, so the frontend can name it
    expect(await oneTooMany.json()).toMatchObject({
      error: { code: 'hive_full', details: { maxSize: MAX_HIVE_SIZE } },
    });

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
    expect(await removal.json()).toMatchObject({
      error: { code: 'not_in_hive' },
    });

    // ... and my hive is untouched
    const mine: { items: unknown[] } = await json(await api('/api/hive'));

    expect(mine.items).toHaveLength(1);
  });
});

describe('making the server work for you', () => {
  it('limits how many searches an account can run', async () => {
    const limited = createTestApp({ limits: { searchesPerMinute: 2 } }).app;
    const user = await createUser('searcher', limited);

    expect((await user('/api/players/search?q=abc')).status).toBe(200);
    expect((await user('/api/players/search?q=abd')).status).toBe(200);
    expect((await user('/api/players/search?q=abe')).status).toBe(429);
    // Other routes are not affected by the search budget
    expect((await user('/api/me')).status).toBe(200);
  });

  it('gives picking a profile and adding bees one shared budget', async () => {
    const limited = createTestApp({ limits: { playerActionsPerHour: 2 } }).app;
    const user = await createUser('collector', limited);
    const ids = ['76561198000000011', '76561198000000012', '76561198000000013'];

    scoreSaber.setPlayer(ME, 'me', []);
    for (const id of ids) scoreSaber.setPlayer(id, `player ${id}`, []);

    expect((await linkProfile(ME, user)).status).toBe(200);
    expect(
      (await postJson('/api/hive', { playerId: ids[0] }, user)).status
    ).toBe(201);

    scoreSaber.requests.length = 0;

    const third = await postJson('/api/hive', { playerId: ids[1] }, user);

    expect(third.status).toBe(429);
    // Refused before the server did anything for it
    expect(scoreSaber.requests).toHaveLength(0);
  });
});

describe('the routes that need no session', () => {
  const callConfig = (
    target: ReturnType<typeof createTestApp>['app'],
    forwardedFor?: string
  ) =>
    target.request('/api/config', {
      headers:
        forwardedFor === undefined ? {} : { 'x-forwarded-for': forwardedFor },
    });

  it('are limited per address', async () => {
    const limited = createTestApp({ limits: { publicPerMinute: 2 } }).app;

    expect((await callConfig(limited)).status).toBe(200);
    expect((await callConfig(limited)).status).toBe(200);

    const blocked = await callConfig(limited);

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    // Health and sign-in share the budget
    expect((await limited.request('/api/health')).status).toBe(429);
    expect((await limited.request('/api/auth/get-session')).status).toBe(429);
  });

  it('do not believe a forwarded address unless a proxy is configured', async () => {
    const limited = createTestApp({ limits: { publicPerMinute: 1 } }).app;

    expect((await callConfig(limited, '203.0.113.1')).status).toBe(200);
    // A different made-up address does not get a fresh budget
    expect((await callConfig(limited, '203.0.113.2')).status).toBe(429);
  });

  it('count by the address the proxy reports when one is configured', async () => {
    const limited = createTestApp({
      limits: { publicPerMinute: 1 },
      trustProxy: true,
    }).app;

    expect((await callConfig(limited, '203.0.113.1')).status).toBe(200);
    expect((await callConfig(limited, '203.0.113.2')).status).toBe(200);
    expect((await callConfig(limited, '203.0.113.1')).status).toBe(429);
    // What the caller put in front of the proxy's entry changes nothing
    expect(
      (await callConfig(limited, '198.51.100.9, 203.0.113.1')).status
    ).toBe(429);
  });
});

describe('what a failed sync reveals', () => {
  it('is a short code, never the text of the error', async () => {
    const logged: string[] = [];
    const manual = createManualQueue();
    const { app: own, services } = createTestApp({
      logError: (message, error) => logged.push(`${message}: ${String(error)}`),
      queue: manual.queue,
    });
    const user = await createUser('test-user', own);
    const BEE = '76561198000000002';

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    await linkProfile(ME, user);
    await postJson('/api/hive', { playerId: BEE }, user);
    await manual.runAll();

    scoreSaber.breakProfile(BEE, { secretInternalDetail: true });
    await services.playersService.requestSync(BEE);
    await manual.runAll();

    const hive = JSON.stringify(await json(await user('/api/hive')));

    expect(hive).toContain('"syncError":"unexpected_response"');
    expect(hive).not.toMatch(
      /Invalid input|secretInternalDetail|expected string/
    );
    // The details are not lost, they are in the server log
    expect(logged.join('\n')).toContain('does not look as expected');
  });
});
