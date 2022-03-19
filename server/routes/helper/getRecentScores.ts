import axios from 'axios';
import { Scores } from '../../../sharedTypes';
import { baseUrl } from '../../constants';
import logger from 'node-color-log';
import delay from './delay';

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
  let isError429: boolean;
  try {
    // logger.debug('Fetching Data - getRecentScores - page ', count);
    apiRes = await axios.get(url);
  } catch (err) {
    logger.error(
      `Error response on page ${count}: ${err.response.status}, ${err.message}`
    );
    if (err.response.status === 429) {
      // The ScoreSaber API limits requests and throws a 429 error. In this case, we needed to wait a minute
      // to continue. Not ideal, but the only solution I could think of for now.
      logger.warn('429 FORBIDDEN, waiting 60 seconds...');
      isError429 = true;
      await delay(60000);
      logger.warn('waited 60 seconds');
    }
    if (err.response.status === 404) {
      logger.info(`Fetching of scores for finsihed at count ${count}.`);
    }
  }

  if (!isError429) {
    if (apiRes === undefined || apiRes.data === undefined) return [];
    if (threshold !== undefined && count > threshold && apiRes !== undefined)
      return apiRes.data.scores;
  } else {
    // Reseting count to continue on the last successfully count, if current request failed because of 429.
    count--;
  }

  const newArray = array.concat(
    await getRecentScores({
      id,
      count: count + 1,
      // if a 429 error occured, we pass through the original array
      array: isError429 ? array : apiRes.data.scores,
      threshold,
    })
  ) as Scores;
  return newArray;
};

export default getRecentScores;
