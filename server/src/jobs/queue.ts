import { PgBoss } from 'pg-boss';

/**
 * Work that happens outside of a request.
 *
 * A request should answer quickly. Fetching thousands of scores does not fit
 * into that, so the request only writes down *that* it has to happen (a
 * "job") and returns. A worker picks the job up and does it. Because jobs
 * are rows in the database, they survive a restart of the server, and a job
 * that fails is tried again.
 */

type SyncJob = {
  /** Fetch even if the player was synced a moment ago */
  force: boolean;
  playerId: string;
};

type Handlers = {
  /** Fetches new scores of one player */
  onSync: (job: SyncJob) => Promise<void>;
  /** Called every few minutes, to catch up on whatever was missed */
  onTick: () => Promise<void>;
};

type JobQueue = {
  /**
   * Asks for a sync of a player. If one is already waiting for this player,
   * nothing is added.
   */
  enqueueSync: (
    job: SyncJob,
    options?: { delaySeconds?: number }
  ) => Promise<void>;
  /** Starts working on jobs with the given handlers */
  start: (handlers: Handlers) => Promise<void>;
  stop: () => Promise<void>;
};

const SYNC_QUEUE = 'sync-player';
const TICK_QUEUE = 'sync-stale';

/** The real queue: jobs are stored in Postgres by pg-boss */
const createPgBossQueue = (connectionString: string): JobQueue => {
  const boss = new PgBoss({ connectionString });

  // Without a listener, an error event would crash the process
  boss.on('error', (error) => console.error('Job queue error', error));

  const ensureQueue = async (
    name: string,
    options?: Parameters<PgBoss['createQueue']>[1]
  ) => {
    if ((await boss.getQueue(name)) === null)
      await boss.createQueue(name, options);
  };

  return {
    enqueueSync: async (job, { delaySeconds } = {}) => {
      await boss.send(SYNC_QUEUE, job, {
        // One key per player. With the "stately" policy of the queue, at most
        // one job per player waits and one runs; further requests are dropped.
        singletonKey: job.playerId,
        startAfter: delaySeconds,
        // A failed job is tried twice more, half a minute apart
        retryLimit: 2,
        retryDelay: 30,
        // A job that runs longer than this is considered stuck
        expireInSeconds: 10 * 60,
      });
    },

    start: async ({ onSync, onTick }) => {
      await boss.start();
      await ensureQueue(SYNC_QUEUE, { policy: 'stately' });
      await ensureQueue(TICK_QUEUE);

      await boss.work<SyncJob>(SYNC_QUEUE, async (jobs) => {
        for (const job of jobs) await onSync(job.data);
      });
      await boss.work(TICK_QUEUE, onTick);
      // Cron syntax: every 15 minutes
      await boss.schedule(TICK_QUEUE, '*/15 * * * *');
    },

    stop: () => boss.stop(),
  };
};

/**
 * A queue for tests: a job runs right where it is enqueued, and the caller
 * waits for it. No timing, no second process, nothing to poll for.
 */
const createInlineQueue = (): JobQueue & { tick: () => Promise<void> } => {
  let handlers: Handlers | undefined;

  return {
    enqueueSync: async (job) => {
      try {
        await handlers?.onSync(job);
      } catch {
        // Like with the real queue, a job that fails does not fail the
        // request that asked for it
      }
    },
    start: (given) => {
      handlers = given;

      return Promise.resolve();
    },
    stop: () => Promise.resolve(),
    /** Runs the periodic job once, as if its time had come */
    tick: async () => {
      await handlers?.onTick();
    },
  };
};

export { createInlineQueue, createPgBossQueue };
export type { Handlers, JobQueue, SyncJob };
