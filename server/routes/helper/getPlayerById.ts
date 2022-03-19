import axios from 'axios';
import { ScoreSaberUserInfo } from '../../../sharedTypes';
import { baseUrl } from '../../constants';
import logger from 'node-color-log';

const getPlayerById = async (id: string): Promise<ScoreSaberUserInfo> => {
  logger.debug(`Getting Player by id ${id}`);
  const url = `${baseUrl}/player/${id}/full`;
  const result = await axios.get(url);
  return result.data;
};

export default getPlayerById;
