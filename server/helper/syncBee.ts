import logger from 'node-color-log';
import { Bee } from '../../sharedTypes';
import getAllScores from '../routes/helper/getAllScores';
import getPlayerById from '../routes/helper/getPlayerById';

const syncBee = async (bee: Bee): Promise<Bee> => {
  const newBee = { ...bee };
  const remotePlayer = await getPlayerById(bee.playerId);
  const remotePlayCount = remotePlayer.scoreStats.totalPlayCount;
  const localPlayCount = bee.playCount;
  const scoreDataExists = bee.scoreData.scoresRecent.length > 0;
  if (localPlayCount === undefined) newBee.playCount = remotePlayCount;

  const needsUpdate = remotePlayCount > newBee.playCount || !scoreDataExists;

  if (needsUpdate) {
    logger.info(
      `${bee.playerName} needs an update. Scoredata exists: ${scoreDataExists}.`
    );
    logger.info(
      `Remote: ${remotePlayCount} / Local: ${newBee.playCount} Syncing...`
    );
    newBee.scoreData = await getAllScores(newBee.playerId);
    newBee.playCount = remotePlayCount;
    logger.info(`...synced.`);
  }

  return newBee;
};

export default syncBee;
