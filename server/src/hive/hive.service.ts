import { AppError } from '../http/errors.ts';

import type { PlayersService } from '../players/players.service.ts';
import type { ComparisonOptions, HiveRepository } from './hive.repository.ts';

type Dependencies = {
  playersService: PlayersService;
  repository: HiveRepository;
};

/** The rules of a hive: who may be added, and what happens when they are */
const createHiveService = ({ playersService, repository }: Dependencies) => {
  /**
   * Adds a player to the owner's hive. The player's scores are fetched right
   * away, so the comparison has something to show.
   */
  const addMember = async (ownerId: string, memberId: string) => {
    if (ownerId === memberId)
      throw new AppError(
        'validation_failed',
        'You cannot add yourself to your hive'
      );

    // Also makes sure the owner exists as a player, the hive refers to both
    await playersService.getOrSyncPlayer(ownerId);
    const result = await playersService.syncPlayer(memberId);

    await repository.addMember(ownerId, memberId);

    return result;
  };

  const removeMember = async (ownerId: string, memberId: string) => {
    const removed = await repository.removeMember(ownerId, memberId);

    if (!removed)
      throw new AppError('not_found', 'This player is not in your hive');
  };

  const compare = async (
    ownerId: string,
    memberId: string,
    options: ComparisonOptions
  ) => {
    if (!(await repository.isMember(ownerId, memberId)))
      throw new AppError('not_found', 'This player is not in your hive');

    return repository.compare(ownerId, memberId, options);
  };

  /** Brings the owner and every bee up to date, one after the other */
  const syncAll = async (ownerId: string) => {
    const members = await repository.listMembers(ownerId);
    const results = [await playersService.syncPlayer(ownerId)];

    for (const { player } of members)
      results.push(await playersService.syncPlayer(player.id));

    return results;
  };

  return {
    addMember,
    compare,
    listMembers: repository.listMembers,
    listNews: repository.listNews,
    removeMember,
    syncAll,
  };
};

type HiveService = ReturnType<typeof createHiveService>;

export { createHiveService };
export type { HiveService };
