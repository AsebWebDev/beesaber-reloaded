import { Bee, UserData } from '../../sharedTypes';
import syncBee from './syncBee';
import syncBeeScores from './syncBeeScores';

const syncMyBees = async (userdata: UserData): Promise<Bee[]> => {
  const syncedBees = await Promise.all(
    userdata.bees.map(async (bee) => await syncBee(bee))
  );

  const newUserdata = { ...userdata, bees: syncedBees };

  return syncBeeScores(newUserdata);
};

export default syncMyBees;
