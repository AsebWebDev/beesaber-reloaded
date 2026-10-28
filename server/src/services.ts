import { createHiveRepository } from './hive/hive.repository.ts';
import { createHiveService } from './hive/hive.service.ts';
import { createPlayersRepository } from './players/players.repository.ts';
import { createPlayersService } from './players/players.service.ts';

import type { Database } from './db/client.ts';
import type { JobQueue } from './jobs/queue.ts';
import type { ScoreSaberClient } from './scoresaber/client.ts';

type Dependencies = {
  db: Database;
  /** See players.service.ts */
  logError?: (message: string, error: unknown) => void;
  /** See players.service.ts */
  minSyncIntervalMs?: number;
  /** The clock. Tests set it to travel in time. */
  now?: () => Date;
  queue: JobQueue;
  scoreSaber: ScoreSaberClient;
};

/**
 * Builds the services from the things they need from outside. Both the HTTP
 * routes and the background jobs use the same set, so a sync does the same
 * whether a click or the live feed asked for it.
 */
const createServices = ({
  db,
  logError,
  minSyncIntervalMs,
  now,
  queue,
  scoreSaber,
}: Dependencies) => {
  const playersService = createPlayersService({
    logError,
    minSyncIntervalMs,
    now,
    queue,
    repository: createPlayersRepository(db),
    scoreSaber,
  });
  const hiveService = createHiveService({
    now,
    repository: createHiveRepository(db),
    playersService,
  });

  return { hiveService, playersService };
};

type Services = ReturnType<typeof createServices>;

/**
 * Connects the queue to the services: what a job of each kind does.
 * Call once at startup.
 */
const startJobs = (queue: JobQueue, { playersService }: Services) =>
  queue.start({
    onSync: async ({ playerId }) => {
      await playersService.runSync(playerId);
    },
    onTick: async () => {
      await playersService.syncStalePlayers();
    },
  });

export { createServices, startJobs };
export type { Services };
