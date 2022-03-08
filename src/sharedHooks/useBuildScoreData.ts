import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { useGetAllScoresQuery } from '@/api/services/apiPlayer/apiPlayer';
import { useAppDispatch } from '@/store/hooks';
import { userIsFetchingData } from '@/store/reducer/appStatusReducer';

import type { ScoreData } from '@/../sharedTypes';

/**
 * Fetch and parse all score data of a user
 * @param {String} id - ScoreSaber id
 * @returns {ScoreData} score data object with recent scores, top scores and a list of
 * score hashes
 */
const useBuildScoreData = (id?: string): ScoreData | undefined => {
  const dispatch = useAppDispatch();
  const [scoreData, setScoreData] = useState<ScoreData>({
    scoredSongsHashes: [],
    scoresRecent: [],
    scoresTop: [],
  });

  const {
    data: fetchedScoreData,
    isFetching,
    isError,
  } = useGetAllScoresQuery(id ?? skipToken);

  useEffect(() => {
    if (fetchedScoreData !== undefined) {
      toast.success('We updated all Scores 👌');
      setScoreData(fetchedScoreData);
    }
  }, [fetchedScoreData]);

  useEffect(() => {
    if (isFetching) {
      toast.info('Updating scores ...');
      dispatch(userIsFetchingData({ status: isFetching }));
    }
  }, [isFetching]);

  useEffect(() => {
    if (isError) {
      toast.error('There has been an issue your scores 🤯');
    }
  }, [isError]);

  return scoreData;
};

export default useBuildScoreData;
