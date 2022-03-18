import axios from 'axios';

const baseUrl = 'https://new.scoresaber.com/api';

const getPlayerById = async (id: string) => {
  const url = `${baseUrl}/player/${id}/full`;
  const result = await axios.get(url);
  return result.data;
};

export default getPlayerById;
