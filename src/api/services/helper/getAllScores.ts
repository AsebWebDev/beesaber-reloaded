/* eslint-disable no-console */
import { apiPlayer } from '@/api/services/apiPlayer/apiPlayer';
import { calcScoreHashed, calcTopScores } from '@/helper/calcScores';
import store from '@/store/store';

import type { ScoreData, Scores } from '@/sharedTypes';

type Props = {
  array?: Scores;
  count?: number;
  id: string;
  threshold?: number;
};

/**
 * Fetch all recent Scores of a ScoreSaberUser
 * @param {String} id - ScoreSaber id
 * @param {number} count - first score page to fetch, default = 1
 * @param {Scores} array - initial array for recursive data fetching, default = []
 * @param {number} threshold - optional threshold for number of score pages (1 page = 8 scores)
 * @returns {Scores} Array of recent scores
 */
const getRecentScores = async ({
  id,
  count = 1,
  array = [],
  threshold,
}: Props): Promise<Scores> => {
  const dispatchedPromise = store.dispatch(
    apiPlayer.endpoints.getRecentScores.initiate({ id, count })
  );
  const { data: response } = await dispatchedPromise;

  if (response === undefined) return [];
  if (threshold !== undefined && count > threshold) return response;

  return array.concat(
    await getRecentScores({ id, count: count + 1, array: response, threshold })
  ) as Scores;
};

const getAllScores = async (
  id: string,
  threshold?: number
): Promise<ScoreData> => {
  const scoresRecent = await getRecentScores({ id, threshold });

  return {
    scoredSongsHashes: calcScoreHashed(scoresRecent),
    scoresRecent,
    scoresTop: calcTopScores(scoresRecent),
  };
};

export { getRecentScores };

export default getAllScores;
