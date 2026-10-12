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
      { job: { playerId: BEE, force: false }, delaySeconds: undefined },
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
    // Forced, because the bee was synced a moment ago, and delayed, because
    // ScoreSaber's score list lags behind the feed
    expect(manual.jobs).toEqual([
      { job: { playerId: BEE, force: true }, delaySeconds: 40 },
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
      { leaderboardId: 1, score: 950, playedAt: '2024-02-01T10:00:00.000Z' },
    ]);
    await services.playersService.handleLiveScore(BEE);

    const news: { items: unknown[] } = (await (
      await api('/api/hive/news')
    ).json()) as never;

    expect(news.items).toHaveLength(1);
    expect(await database.db.select().from(scoreEvents)).toHaveLength(3);
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

  it('runs as the queue’s periodic job', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    // Nothing is stale yet, so the job has nothing to do, but it has to run
    await expect(tick()).resolves.toBeUndefined();
  });
});
