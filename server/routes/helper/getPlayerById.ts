import axios from 'axios';
import { ScoreSaberUserInfo } from '../../../sharedTypes';
import { baseUrl } from '../../constants';

const getPlayerById = async (id: string): Promise<ScoreSaberUserInfo> => {
  const url = `${baseUrl}/player/${id}/full`;
  const result = await axios.get(url);
  return result.data;
};

export default getPlayerById;
