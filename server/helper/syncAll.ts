import { UserData } from '../../sharedTypes';
import syncMyScoreData from './syncMyScoreData';

const syncAll = async (userData: UserData): Promise<UserData> => {
  const newScoreData = await syncMyScoreData(userData);

  return { ...userData, scoreData: newScoreData };
};

export default syncAll;
