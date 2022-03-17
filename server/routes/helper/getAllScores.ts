import { ScoreData } from '../../../sharedTypes';
import { calcScoreHashed, calcTopScores } from './calcScores';
import getRecentScores from './getRecentScores';

/**
 * Fetch all Scores of a ScoreSaberUser
 * @param {String} id - ScoreSaber id
 * @returns {ScoreData} ScoreData with recentScores, topScores and all score hashes
 */
const getAllScores = async (id: string): Promise<ScoreData> => {
  const threshold = 10;
  const scoresRecent = await getRecentScores({ id, threshold });

  return {
    scoredSongsHashes: calcScoreHashed(scoresRecent),
    scoresRecent,
    scoresTop: calcTopScores(scoresRecent),
  };
};

export default getAllScores;
