import { UserData } from '../../sharedTypes';
import User from '../models/User';
import getAllScores from '../routes/helper/getAllScores';

const updateAllScores = async (userData: UserData): Promise<UserData> => {
  const { myScoreSaberId, _id } = userData;
  if (myScoreSaberId === '') return userData;

  const newScoreData = await getAllScores(myScoreSaberId);

  const newUserData: UserData = {
    ...userData,
    scoreData: newScoreData,
  };

  User.findByIdAndUpdate(_id, newUserData as Express.User, { new: true })
    .then((user: UserData) => console.log('Updated: ', user.googleName))
    .catch((err: unknown) => console.log(err));

  return newUserData;
};

export default updateAllScores;
