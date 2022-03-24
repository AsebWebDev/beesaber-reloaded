import { Bee } from '../../sharedTypes';
import syncBee from './syncBee';

const syncMyBees = async (bees: Bee[]): Promise<Bee[]> => {
  let beesCopy = [...bees];
  const updatedBees = await Promise.all(
    beesCopy.map(async (bee) => await syncBee(bee))
  );

  return updatedBees;
};

export default syncMyBees;
