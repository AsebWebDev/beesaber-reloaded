import { afterEach, describe, expect, it } from 'vitest';

import { TEST_DATABASE_URL } from '../testing/database.ts';
import { connectionOptions, createPgBossQueue } from './queue.ts';

import type { JobQueue, SyncJob } from './queue.ts';

/**
 * The other tests use stand-ins for the queue. This one uses the real one,
 * pg-boss with the test database, to prove that a job goes in on one side
 * and comes out at the worker.
 */

const waitFor = async (condition: () => boolean, timeoutMs: number) => {
  const deadline = Date.now() + timeoutMs;

  while (!condition() && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 100));
};

describe('the pg-boss queue', () => {
  let queue: JobQueue | undefined;

  afterEach(async () => {
    await queue?.stop();
  });

  it('delivers a job to the worker, and one job for two requests of the same player', async () => {
    const received: SyncJob[] = [];
    // Unique per run, so jobs left over from an earlier run cannot interfere
    const playerId = String(Date.now());

    queue = createPgBossQueue(TEST_DATABASE_URL);

    await queue.start({
      onSync: (job) => {
        if (job.playerId === playerId) received.push(job);

        return Promise.resolve();
      },
      onTick: () => Promise.resolve(),
    });

    // Both are queued before the worker polls for the first time
    await queue.enqueueSync({ playerId });
    await queue.enqueueSync({ playerId });

    await waitFor(() => received.length > 0, 15_000);
    // Leave time for a second delivery, if there wrongly were one
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(received).toEqual([{ playerId }]);
  }, 30_000);
});

describe('how pg-boss connects', () => {
  it('uses the connection string as it is when it holds the password', () => {
    expect(connectionOptions('postgres://app:secret@db:5432/beesaber')).toEqual(
      { connectionString: 'postgres://app:secret@db:5432/beesaber' }
    );
  });

  it('hands over the parts one by one with a password function, encrypted', () => {
    const password = () => Promise.resolve('token');

    expect(
      connectionOptions(
        'postgres://id-beesaber@psql.example.org/beesaber?sslmode=verify-full',
        password
      )
    ).toEqual({
      host: 'psql.example.org',
      port: 5432,
      database: 'beesaber',
      user: 'id-beesaber',
      password,
      ssl: true,
    });
  });
});
