import apiPlayer from '@/api/services/apiPlayer/apiPlayer';
import store from '@/store/store';

const verifyValidScoreSaberId = async (id: string): Promise<boolean> => {
  const result = await store.dispatch(
    apiPlayer.endpoints.getRecentScores.initiate({ id, count: 1 })
  );

  return result.error !== undefined && result.data !== undefined;
};

export default verifyValidScoreSaberId;
