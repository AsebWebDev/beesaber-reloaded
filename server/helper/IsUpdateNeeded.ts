import logger from 'node-color-log';
import { ScoreSaberUserInfo, UserData } from '../../sharedTypes';
import User from '../models/User';
import getPlayerById from './getPlayerById';

type UserDocType = UserData & {
  toObject?: () => UserData;
};

/**
 *
 * @param userData
 * @returns if the userscores need to be updated. To avoid verbose syncing a quick compare
 * of the remote total playcount with the playcount on the local database is done. Only if
 * the scores differ all scores will be fetched again.
 */
const isUpdateNeeded = async (userData: UserData): Promise<boolean> => {
  const { playerInfo } = userData;
  if (playerInfo === undefined) return false;
  const { _id: mongoId, myScoreSaberId } = userData;

  if (myScoreSaberId === '' || myScoreSaberId === undefined) return false;
  const result: ScoreSaberUserInfo = await getPlayerById(myScoreSaberId);
  const remotePlayCount = result.scoreStats.totalPlayCount;
  const localPlayCount = await User.findById(mongoId)
    .then(async (userDoc: UserDocType) => {
      if (!userDoc) return;
      return userDoc.totalPlayCount;
    })
    .catch((err: unknown) => logger.error(err));

  const noScoresExist =
    userData.scoreData.scoresRecent === undefined ||
    userData.scoreData.scoresRecent.length === 0;

  const updateNeeded = remotePlayCount > localPlayCount || noScoresExist;

  if (updateNeeded) {
    if (remotePlayCount > localPlayCount)
      logger.warn(
        `Update needed (${playerInfo.playerName}): Remote: ${remotePlayCount} /  Local ${localPlayCount}`
      );
    if (noScoresExist)
      logger.warn(`Update needed (${playerInfo.playerName}): No scores!`);
  } else {
    logger.debug(`No updated needed (${playerInfo.playerName})`);
  }

  return updateNeeded;
};

export default isUpdateNeeded;
