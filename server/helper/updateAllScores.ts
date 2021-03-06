import { UserData } from '../../sharedTypes';
import User from '../models/User';
import getAllScores from './getAllScores';
import getPlayerById from './getPlayerById';
import logger from 'node-color-log';
import isUpdateNeeded from './IsUpdateNeeded';

/**
 *
 * @param userData
 * @returns userdata with updated scores, updated userdata will be stored in local database
 */
const updateAllScores = async (userData: UserData): Promise<UserData> => {
  logger.info(`Updating all scores of ${userData.playerInfo.playerName}`);
  const { myScoreSaberId, _id } = userData;
  if (myScoreSaberId === '') return userData;

  const needsUpdate = await isUpdateNeeded(userData);

  const newScoreData = needsUpdate
    ? await getAllScores(myScoreSaberId)
    : userData.scoreData;
  const player = await getPlayerById(myScoreSaberId);
  const remotePlayCount = player.scoreStats.totalPlayCount;

  const newUserData: UserData = {
    ...userData,
    scoreData: newScoreData,
    totalPlayCount: remotePlayCount,
  };

  User.findByIdAndUpdate(_id, newUserData as Express.User, { new: true })
    .then((user: UserData) =>
      logger.info('Updated all scores for : ', user.googleName)
    )
    .catch((err: unknown) => logger.error(err));

  return newUserData;
};

export default updateAllScores;
