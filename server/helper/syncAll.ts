import { UserData } from '../../sharedTypes';
import syncMyScoreData from './syncMyScoreData';
import syncMyBees from './syncMyBees';
import logger from 'node-color-log';

const syncAll = async (userData: UserData): Promise<UserData> => {
  logger.info(`syncing my ScoreData...`);
  const newScoreData = await syncMyScoreData(userData);
  logger.info(`syncing my Bees`);
  const updatedBees = await syncMyBees(userData.bees);

  return { ...userData, bees: updatedBees, scoreData: newScoreData };
};

export default syncAll;
