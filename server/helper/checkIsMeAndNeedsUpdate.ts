import logger from 'node-color-log';
import User from '../models/User';
import { UserData } from '../../sharedTypes';
import isUpdateNeeded from '../helper/IsUpdateNeeded';

type UserDocType =
  | (UserData & {
      toObject?: () => UserData;
    })
  | null;

type ReturnType = {
  isMe: boolean;
  needsUpdate?: boolean;
  userData?: UserData;
};

const checkIsMeAndNeedsUpdate = async (id: string): Promise<ReturnType> => {
  const result: UserDocType = await User.findOne({ myScoreSaberId: id });
  const isMe = result !== null;
  if (!isMe) return { isMe };
  logger.success(`It's you (${result?.playerInfo?.playerName})!`);
  const parsedUserData = result?.toObject();

  const needsUpdate = await isUpdateNeeded(parsedUserData);

  return {
    isMe,
    needsUpdate,
    userData: parsedUserData,
  };
};

export default checkIsMeAndNeedsUpdate;
