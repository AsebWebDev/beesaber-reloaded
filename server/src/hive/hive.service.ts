import { AppError } from '../http/errors.ts';

import type { Me } from '../http/session.ts';
import type { PlayersService } from '../players/players.service.ts';
import type { ComparisonOptions, HiveRepository } from './hive.repository.ts';

type Dependencies = {
  playersService: PlayersService;
  repository: HiveRepository;
};

/**
 * The most bees a hive can have. Every bee means stored scores and requests
 * to ScoreSaber, so the number needs an upper bound.
 */
const MAX_HIVE_SIZE = 50;

/** The rules of a hive: who may be added, and what happens when they are */
const createHiveService = ({ playersService, repository }: Dependencies) => {
  /**
   * Adds a player to my hive. Their profile is looked up right away, which
   * also proves that ScoreSaber knows them. Their scores follow in the
   * background.
   */
  const addMember = async (me: Me, memberId: string) => {
    if (me.playerId === memberId)
      throw new AppError(
        'validation_failed',
        'You cannot add yourself to your hive'
      );

    await playersService.ensureProfile(memberId);

    const outcome = await repository.addMember(
      me.userId,
      memberId,
      MAX_HIVE_SIZE
    );

    if (outcome === 'full')
      throw new AppError(
        'validation_failed',
        `A hive can have at most ${MAX_HIVE_SIZE} bees`
      );

    await playersService.requestSync(memberId);

    // Read again: the sync request has just changed the player
    return playersService.ensureProfile(memberId);
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

  /** Asks for new scores of me and every bee. Says how many were queued. */
  const syncAll = async (me: Me) => {
    const members = await repository.listMembers(me);
    const playerIds = [me.playerId, ...members.map(({ player }) => player.id)];
    let queued = 0;

    for (const playerId of playerIds)
      if ((await playersService.requestSync(playerId)).queued) queued += 1;

    return { queued, upToDate: playerIds.length - queued };
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

export { createHiveService, MAX_HIVE_SIZE };
export type { HiveService };
