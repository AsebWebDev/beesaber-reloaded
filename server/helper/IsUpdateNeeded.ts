import logger from 'node-color-log';
import { ScoreSaberUserInfo, UserData } from '../../sharedTypes';
import User from '../models/User';
import getPlayerById from '../routes/helper/getPlayerById';

type UserDocType = UserData & {
  toObject?: () => UserData;
};

const isUpdateNeeded = async (userData: UserData): Promise<boolean> => {
  const { _id: mongoId, myScoreSaberId } = userData;

  if (myScoreSaberId === '') return false;
  const result: ScoreSaberUserInfo = await getPlayerById(myScoreSaberId);
  const remotePlayCount = result.scoreStats.totalPlayCount;
  const localPlayCount = await User.findById(mongoId)
    .then(async (userDoc: UserDocType) => {
      if (!userDoc) return;
      return userDoc.totalPlayCount;
    })
    .catch((err: unknown) => logger.error(err));
  if (remotePlayCount > localPlayCount) {
    logger.warn(
      `Update needed (${userData.playerInfo.playerName}): Remote: ${remotePlayCount} /  Local ${localPlayCount}`
    );
  } else {
    logger.debug(`No updated needed (${userData.playerInfo.playerName})`);
  }

  return remotePlayCount > localPlayCount;
};

export default isUpdateNeeded;
