/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import getAllScores from '@/api/services/helper/getAllScores';
import { useAppDispatch } from '@/store/hooks';
import { userIsFetchingData } from '@/store/reducer/appStatusReducer';

import type { ScoreData } from '@/../sharedTypes';

/**
 * Fetch and parse all score data of a user
 * @param {String} id - ScoreSaber id
 * @param {number} threshold - optional threshold for number of score pages (1 page = 8 scores)
 * @returns {ScoreData} score data object with recent scores, top scores and a list of
 * score hashes
 */
const useBuildScoreData = (
  id?: string,
  threshold?: number
): ScoreData | undefined => {
  if (id === undefined) return undefined;
  const dispatch = useAppDispatch();
  const [isFetching, setIsFetching] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreData>({
    scoredSongsHashes: [],
    scoresRecent: [],
    scoresTop: [],
  });

  useEffect(() => {
    setIsFetching(true);
    const fetchData = async () => {
      try {
        const resp = await toast.promise<ScoreData>(
          getAllScores(id, threshold),
          {
            pending: 'Updating scores ...',
            success: 'We updated all Scores 👌',
            error: 'There has been an issue your scores 🤯',
          }
        );

        setScoreData(resp);
        setIsFetching(false);
      } catch (error: unknown) {
        console.log(
          '🚀 ~ file: useBuildScoreData.ts ~ line 34 ~ fetchData ~ error',
          error
        );
        setIsFetching(false);
      }
    };

    void fetchData();
  }, [id]);

  dispatch(userIsFetchingData({ status: isFetching }));

  return scoreData;
};

export default useBuildScoreData;
