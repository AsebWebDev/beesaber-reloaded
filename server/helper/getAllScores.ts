import { ScoreData } from '../../sharedTypes';
import calcAllScores from './calcScores';
import getRecentScores from './getRecentScores';
import logger from 'node-color-log';

/**
 * Fetch all Scores of a ScoreSaberUser
 * @param {String} id - ScoreSaber id
 * @returns {ScoreData} ScoreData with recentScores, topScores and all score hashes
 */
const getAllScores = async (id: string): Promise<ScoreData> => {
  logger.debug('Building all scores for id ', id);

  const scoresRecent = await getRecentScores({ id });

  return calcAllScores(scoresRecent);
};

export default getAllScores;
