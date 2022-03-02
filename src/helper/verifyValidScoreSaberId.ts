import api from '../api/api';

// TODO: Use RTKQ endpoint isValidMongoId
const verifyValidScoreSaberId = async (id: string): Promise<void> => {
  try {
    await api.userApi.getRecentUserScores(id);
  } catch (err: unknown) {
    throw new Error(
      'ScoreSaber Id does not exist. Please check your id again...'
    );
  }
};

export default verifyValidScoreSaberId;
