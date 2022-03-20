import logger from 'node-color-log';
import { ScoreSaberUserInfo, UserData } from '../../sharedTypes';
import User from '../models/User';
import getPlayerById from '../routes/helper/getPlayerById';

type UserDocType = UserData & {
  toObject?: () => UserData;
};

const isUpdateNeeded = async (userData: UserData): Promise<boolean> => {
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
        `Update needed (${userData.playerInfo.playerName}): Remote: ${remotePlayCount} /  Local ${localPlayCount}`
      );
    if (noScoresExist)
      logger.warn(
        `Update needed (${userData.playerInfo.playerName}): No scores!`
      );
  } else {
    logger.debug(`No updated needed (${userData.playerInfo.playerName})`);
  }

  return updateNeeded;
};

export default isUpdateNeeded;
