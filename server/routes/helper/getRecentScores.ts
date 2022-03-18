import axios from 'axios';
import { Scores } from '../../../sharedTypes';
import { baseUrl } from '../../constants';

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
  const url = `${baseUrl}/player/${id}/scores/recent/${count}`;
  let apiRes;
  try {
    console.log('Fetching Data - getRecentScores - page ', count);
    apiRes = await axios.get(url);
  } catch (err) {
    console.error(`Error response on page ${count}: ${err.response.status}`);
  }
  if (apiRes === undefined || apiRes.data === undefined) return [];
  if (threshold !== undefined && count > threshold) return apiRes.data.scores;

  const newArray = array.concat(
    await getRecentScores({
      id,
      count: count + 1,
      array: apiRes.data.scores,
      threshold,
    })
  ) as Scores;
  return newArray;
};

export default getRecentScores;
