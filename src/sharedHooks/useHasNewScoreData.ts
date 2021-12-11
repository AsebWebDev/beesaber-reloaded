import { useEffect, useState } from 'react';

import { useGetFullPlayerQuery } from '@/api/services/apiPlayer/apiPlayer';
import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';

const useHasNewScoreData = (userId: string): boolean => {
  const [scoreSaberId, setScoreSaberId] = useState<string>('');
  const [hasNewScores, setHasNewScores] = useState<boolean>(false);

  const { data } = useGetUserDataQuery(userId);

  const _scoreSaberId = data?.playerInfo?.playerId;
  const totalPlayCount = data?.totalPlayCount;

  useEffect(() => {
    if (_scoreSaberId !== undefined) setScoreSaberId(_scoreSaberId);
  }, [_scoreSaberId]);

  const { data: scoreSaberData } = useGetFullPlayerQuery(scoreSaberId);

  useEffect(() => {
    const totalPlayCountSS = scoreSaberData?.scoreStats.totalPlayCount;

    if (
      totalPlayCount !== undefined &&
      totalPlayCountSS !== undefined &&
      totalPlayCount < totalPlayCountSS
    )
      setHasNewScores(true);
  }, [scoreSaberData]);

  return hasNewScores;
};

export default useHasNewScoreData;
