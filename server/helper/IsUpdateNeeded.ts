import { ScoreSaberUserInfo, UserData } from '../../sharedTypes';
import User from '../models/User';
import getPlayerById from '../routes/helper/getPlayerById';

const isUpdateNeeded = async (userData: UserData): Promise<boolean> => {
  const { _id: mongoId, myScoreSaberId } = userData;

  const result: ScoreSaberUserInfo = await getPlayerById(myScoreSaberId);
  const remotePlayCount = result.scoreStats.totalPlayCount;
  const localPlayCount = await User.findById(mongoId)
    .then(async (userDoc: UserData) => {
      if (!userDoc) return;
      return userDoc.totalPlayCount;
    })
    .catch((err: unknown) => console.log(err));
  if (remotePlayCount > localPlayCount)
    console.log(
      `Update needed: Remote: ${remotePlayCount} Local ${localPlayCount}`
    );

  return remotePlayCount > localPlayCount;
};

export default isUpdateNeeded;
