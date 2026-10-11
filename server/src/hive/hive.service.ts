import { AppError } from '../http/errors.ts';

import type { Me } from '../http/session.ts';
import type { PlayersService } from '../players/players.service.ts';
import type { ComparisonOptions, HiveRepository } from './hive.repository.ts';

type Dependencies = {
  playersService: PlayersService;
  repository: HiveRepository;
};

/** The rules of a hive: who may be added, and what happens when they are */
const createHiveService = ({ playersService, repository }: Dependencies) => {
  /**
   * Adds a player to my hive. The player's scores are fetched right away, so
   * the comparison has something to show.
   */
  const addMember = async (me: Me, memberId: string) => {
    if (me.playerId === memberId)
      throw new AppError(
        'validation_failed',
        'You cannot add yourself to your hive'
      );

    const result = await playersService.syncPlayer(memberId);

    await repository.addMember(me.userId, memberId);

    return result;
  };

  const removeMember = async (me: Me, memberId: string) => {
    const removed = await repository.removeMember(me.userId, memberId);

    if (!removed)
      throw new AppError('not_found', 'This player is not in your hive');
  };

  const compare = async (
    me: Me,
    memberId: string,
    options: ComparisonOptions
  ) => {
    if (!(await repository.isMember(me.userId, memberId)))
      throw new AppError('not_found', 'This player is not in your hive');

    return repository.compare(me.playerId, memberId, options);
  };

  /** Brings me and every bee up to date, one after the other */
  const syncAll = async (me: Me) => {
    const members = await repository.listMembers(me);
    const results = [await playersService.syncPlayer(me.playerId)];

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
