import api from '../api/api';

const isValidSSId = async (id: string): Promise<boolean> => {
  try {
    await api.userApi.getRecentUserScores(id);

    return true;
  } catch (err: unknown) {
    return false;
  }
};

export default isValidSSId;
