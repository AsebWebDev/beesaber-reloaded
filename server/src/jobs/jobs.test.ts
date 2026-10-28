import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { players, scoreEvents } from '../db/schema.ts';
import {
  api,
  createManualQueue,
  createTestApp,
  createUser,
  database,
  linkProfile,
  ME,
  scoreSaber,
  services,
  tick,
} from '../testing/harness.ts';

/**
 * Background work: what gets queued when, what a job does, and how the two
 * sources of jobs behave (the live feed and the periodic catch-up).
 */

const BEE = '76561198000000002';
const STRANGER = '76561198000000003';

/**
 * A moment shortly after now. News only counts scores set after the bee
 * joined the hive, which in a test is "now".
 */
const soon = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const playerRow = async (id: string) => {
  const [row] = await database.db
    .select()
    .from(players)
    .where(eq(players.id, id));

  return row;
};

const postJson = (path: string, body: unknown, as = api) =>
  as(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('adding a bee', () => {
  it('answers before any score is fetched and marks the player as syncing', async () => {
    const manual = createManualQueue();
    const { app } = createTestApp({ queue: manual.queue });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    await linkProfile(ME, user);
    await manual.runAll();
    scoreSaber.requests.length = 0;

    const response = await postJson('/api/hive', { playerId: BEE }, user);

    expect(response.status).toBe(201);
    // The job is waiting, no score request has gone out
    expect(manual.jobs).toEqual([
      { job: { playerId: BEE }, delaySeconds: undefined, priority: 'user' },
    ]);
    expect(scoreSaber.requests).toHaveLength(0);
    expect((await playerRow(BEE))?.syncStartedAt).toBeInstanceOf(Date);
    expect((await playerRow(BEE))?.scoresSyncedAt).toBeNull();

    // Then the worker gets to it
    expect(await manual.runAll()).toEqual([]);

    expect((await playerRow(BEE))?.syncStartedAt).toBeNull();
    expect((await playerRow(BEE))?.scoresSyncedAt).toBeInstanceOf(Date);
    expect(scoreSaber.requests).toHaveLength(1);
  });

  it('still refuses a player ScoreSaber does not know, right away', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await postJson('/api/hive', {
      playerId: '76561198999999999',
    });

    expect(response.status).toBe(404);
  });
});

describe('asking who is being fetched', () => {
  const syncing = async (as = api) => {
    const body = (await (await as('/api/hive/sync')).json()) as {
      syncing: { playerId: string; since: string }[];
    };

    return body.syncing;
  };

  it('names me and my bees while their jobs wait, and nobody once they ran', async () => {
    const manual = createManualQueue();
    const { app } = createTestApp({ queue: manual.queue });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    await linkProfile(ME, user);

    expect((await syncing(user)).map((entry) => entry.playerId)).toEqual([ME]);

    await manual.runAll();
    await postJson('/api/hive', { playerId: BEE }, user);

    const waiting = await syncing(user);

    expect(waiting.map((entry) => entry.playerId)).toEqual([BEE]);
    expect(Number.isNaN(Date.parse(waiting[0]!.since))).toBe(false);

    await manual.runAll();

    expect(await syncing(user)).toEqual([]);
  });

  it('leaves out players of other hives', async () => {
    const manual = createManualQueue();
    const { app } = createTestApp({ queue: manual.queue });
    const user = await createUser('test-user', app);
    const other = await createUser('other-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    scoreSaber.setPlayer(STRANGER, 'stranger', []);
    await linkProfile(ME, user);
    await linkProfile(STRANGER, other);
    await manual.runAll();

    // The other account's bee is being fetched, mine are not
    await postJson('/api/hive', { playerId: BEE }, other);

    expect(await syncing(user)).toEqual([]);
    expect(await syncing(other)).toHaveLength(1);
  });
});

describe('the periodic catch-up', () => {
  it('queues its jobs behind those a user or the live feed asked for', async () => {
    let time = new Date('2024-05-01T12:00:00.000Z');
    const manual = createManualQueue();
    const { app, services: own } = createTestApp({
      now: () => time,
      queue: manual.queue,
    });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME, user);
    await manual.runAll();

    time = new Date(time.getTime() + 60 * 60 * 1000);
    await own.playersService.syncStalePlayers();

    expect(manual.jobs).toMatchObject([
      { job: { playerId: ME }, priority: 'catchUp' },
    ]);
  });
});

describe('a sync job that fails', () => {
  it('notes the reason on the player and reports the error to the queue', async () => {
    const manual = createManualQueue();
    const { services: own } = createTestApp({ queue: manual.queue });

    scoreSaber.setPlayer(BEE, 'bee', []);
    await own.playersService.requestSync(BEE);
    // ScoreSaber starts answering nonsense before the job runs
    scoreSaber.breakProfile(BEE, { unexpected: true });

    const errors = await manual.runAll();

    // The queue sees the error, which is what makes it retry
    expect(errors).toHaveLength(1);

    const row = await playerRow(BEE);

    expect(row?.syncStartedAt).toBeNull();
    // A code, not the text of the exception
    expect(row?.syncError).toBe('unexpected_response');
    expect(row?.scoresSyncedAt).toBeNull();
  });

  it('counts as failed only once the queue gives up on it', async () => {
    const manual = createManualQueue();
    const { services: own } = createTestApp({ queue: manual.queue });

    scoreSaber.setPlayer(BEE, 'bee', []);
    await own.playersService.requestSync(BEE);
    scoreSaber.breakProfile(BEE, { unexpected: true });

    // A first attempt fails, and a retry follows
    expect(await manual.runAll({ last: false })).toHaveLength(1);
    expect(await playerRow(BEE)).toMatchObject({
      syncFailures: 0,
      syncError: null,
    });
    expect((await playerRow(BEE))?.syncStartedAt).toBeInstanceOf(Date);

    // The retry fails too, and it was the last one
    await own.playersService.requestSync(BEE, { force: true });
    expect(await manual.runAll()).toHaveLength(1);
    expect(await playerRow(BEE)).toMatchObject({
      syncFailures: 1,
      syncError: 'unexpected_response',
      syncStartedAt: null,
    });
  });

  it('clears the reason once a later attempt succeeds', async () => {
    const manual = createManualQueue();
    const { services: own } = createTestApp({ queue: manual.queue });

    scoreSaber.setPlayer(BEE, 'bee', []);
    await own.playersService.requestSync(BEE);
    scoreSaber.breakProfile(BEE, { unexpected: true });
    await manual.runAll();

    scoreSaber.reset();
    scoreSaber.setPlayer(BEE, 'bee', []);
    await own.playersService.requestSync(BEE);
    await manual.runAll();

    expect((await playerRow(BEE))?.syncError).toBeNull();
    expect((await playerRow(BEE))?.scoresSyncedAt).toBeInstanceOf(Date);
  });
});

describe('a score on the live feed', () => {
  it('queues a delayed sync when it is from a bee', async () => {
    const manual = createManualQueue();
    const { app, services: own } = createTestApp({ queue: manual.queue });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    await linkProfile(ME, user);
    await postJson('/api/hive', { playerId: BEE }, user);
    await manual.runAll();

    const tracked = await own.playersService.handleLiveScore(BEE);

    expect(tracked).toBe(true);
    // Queued although the bee was synced a moment ago, and delayed, because
    // ScoreSaber's score list lags behind the feed
    expect(manual.jobs).toEqual([
      { job: { playerId: BEE }, delaySeconds: 40, priority: 'live' },
    ]);
  });

  it('queues a sync when it is from a profile an account compares as', async () => {
    const manual = createManualQueue();
    const { app, services: own } = createTestApp({ queue: manual.queue });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME, user);
    await manual.runAll();

    expect(await own.playersService.handleLiveScore(ME)).toBe(true);
    expect(manual.jobs).toHaveLength(1);
  });

  it('is ignored when nobody follows the player', async () => {
    const manual = createManualQueue();
    const { services: own } = createTestApp({ queue: manual.queue });

    // Known to us, because someone once looked them up, but in no hive
    scoreSaber.setPlayer(STRANGER, 'stranger', []);
    await own.playersService.ensureProfile(STRANGER);

    expect(await own.playersService.handleLiveScore(STRANGER)).toBe(false);
    // And a player we have never heard of
    expect(await own.playersService.handleLiveScore('76561198999999999')).toBe(
      false
    );
    expect(manual.jobs).toEqual([]);
  });

  it('leads to news for the hive owner once the job has run', async () => {
    scoreSaber.setPlayer(ME, 'me', [
      { leaderboardId: 1, score: 900, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 800, playedAt: '2024-01-02T10:00:00.000Z' },
    ]);
    await linkProfile(ME);
    await postJson('/api/hive', { playerId: BEE });

    // The bee plays and goes past me; the feed announces it
    scoreSaber.setPlayer(BEE, 'bee', [
      { leaderboardId: 1, score: 950, playedAt: soon(1) },
    ]);
    await services.playersService.handleLiveScore(BEE);

    const news: { items: unknown[] } = (await (
      await api('/api/hive/news')
    ).json()) as never;

    expect(news.items).toHaveLength(1);
    // The first syncs of both players logged nothing
    expect(await database.db.select().from(scoreEvents)).toHaveLength(1);
  });
});

describe('the periodic catch-up', () => {
  const HOUR = 60 * 60 * 1000;

  it('syncs tracked players whose scores are old, and only those', async () => {
    let time = new Date('2024-05-01T12:00:00.000Z');
    const manual = createManualQueue();
    const { app, services: own } = createTestApp({
      now: () => time,
      queue: manual.queue,
    });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    scoreSaber.setPlayer(STRANGER, 'stranger', []);
    await linkProfile(ME, user);
    await postJson('/api/hive', { playerId: BEE }, user);
    await own.playersService.requestSync(STRANGER);
    await manual.runAll();

    // Right after syncing, nobody is stale
    expect(await own.playersService.syncStalePlayers()).toBe(0);

    time = new Date(time.getTime() + HOUR);

    // An hour later, the two tracked players are. The stranger is in no hive.
    expect(await own.playersService.syncStalePlayers()).toBe(2);
    expect(manual.jobs.map(({ job }) => job.playerId).sort()).toEqual(
      [ME, BEE].sort()
    );
  });

  it('restarts a sync that has been "running" for too long', async () => {
    let time = new Date('2024-05-01T12:00:00.000Z');
    const manual = createManualQueue();
    const { app, services: own } = createTestApp({
      now: () => time,
      queue: manual.queue,
    });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME, user);
    // The job is queued and then lost: nobody ever runs it
    manual.jobs.length = 0;

    time = new Date(time.getTime() + 5 * 60 * 1000);
    expect(await own.playersService.syncStalePlayers()).toBe(0);

    time = new Date(time.getTime() + HOUR);
    expect(await own.playersService.syncStalePlayers()).toBe(1);
    expect(manual.jobs).toHaveLength(1);
  });

  it('waits longer after every failed attempt before trying a player again', async () => {
    const MINUTE = 60 * 1000;
    let time = new Date('2024-05-01T12:00:00.000Z');
    const later = (minutes: number) => {
      time = new Date(time.getTime() + minutes * MINUTE);
    };
    const manual = createManualQueue();
    const { app, services: own } = createTestApp({
      now: () => time,
      queue: manual.queue,
    });
    const user = await createUser('test-user', app);

    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME, user);
    await manual.runAll();

    // From now on ScoreSaber answers nonsense for this player
    scoreSaber.breakProfile(ME, { unexpected: true });

    // Stale after an hour: tried, and it fails for the first time
    later(60);
    expect(await own.playersService.syncStalePlayers()).toBe(1);
    await manual.runAll();
    expect((await playerRow(ME))?.syncFailures).toBe(1);

    // Not again within half an hour ...
    later(20);
    expect(await own.playersService.syncStalePlayers()).toBe(0);
    // ... but after it. Second failure.
    later(15);
    expect(await own.playersService.syncStalePlayers()).toBe(1);
    await manual.runAll();
    expect((await playerRow(ME))?.syncFailures).toBe(2);

    // The wait has doubled to an hour
    later(45);
    expect(await own.playersService.syncStalePlayers()).toBe(0);
    later(20);
    expect(await own.playersService.syncStalePlayers()).toBe(1);

    // Once it works again, the count starts over
    scoreSaber.reset();
    scoreSaber.setPlayer(ME, 'me', []);
    await manual.runAll();
    expect(await playerRow(ME)).toMatchObject({
      syncFailures: 0,
      syncFailedAt: null,
      syncError: null,
    });
  });

  it('runs as the queue’s periodic job', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    // Nothing is stale yet, so the job has nothing to do, but it has to run
    await expect(tick()).resolves.toBeUndefined();
  });
});
