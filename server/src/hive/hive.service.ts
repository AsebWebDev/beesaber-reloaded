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
        'cannot_add_self',
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
        'hive_full',
        `A hive can have at most ${MAX_HIVE_SIZE} bees`,
        { maxSize: MAX_HIVE_SIZE }
      );

    await playersService.requestSync(memberId);

    // Read again: the sync request has just changed the player
    return playersService.ensureProfile(memberId);
  };

  const removeMember = async (me: Me, memberId: string) => {
    const removed = await repository.removeMember(me.userId, memberId);

    if (!removed)
      throw new AppError('not_in_hive', 'This player is not in your hive');
  };

  const compare = async (
    me: Me,
    memberId: string,
    options: ComparisonOptions
  ) => {
    if (!(await repository.isMember(me.userId, memberId)))
      throw new AppError('not_in_hive', 'This player is not in your hive');

    return repository.compare(me.playerId, memberId, options);
  };

  /** Asks for new scores of me and every bee. Says how many were queued. */
  const syncAll = async (me: Me) => {
    const playerIds = [
      me.playerId,
      ...(await repository.listMemberIds(me.userId)),
    ];
    let queued = 0;

    for (const playerId of playerIds)
      if ((await playersService.requestSync(playerId)).queued) queued += 1;

    return { queued, upToDate: playerIds.length - queued };
  };

  /** How I and my bees stand on one map */
  const mapRanking = async (me: Me, leaderboardId: number) => {
    const ranking = await repository.mapRanking(me, leaderboardId);

    if (ranking === undefined)
      throw new AppError(
        'unknown_map',
        'Nobody tracked here has played this map'
      );

    return ranking;
  };

  /** Whose scores are being fetched right now, out of me and my bees */
  const listSyncing = async (me: Me) =>
    (await repository.listSyncing(me)).flatMap(({ playerId, since }) =>
      // The query only returns players with a start time; this tells the
      // compiler so
      since === null ? [] : [{ playerId, since }]
    );

  return {
    addMember,
    compare,
    listMembers: repository.listMembers,
    listNews: repository.listNews,
    listSyncing,
    mapRanking,
    removeMember,
    syncAll,
  };
};

type HiveService = ReturnType<typeof createHiveService>;

export { createHiveService, MAX_HIVE_SIZE };
export type { HiveService };
