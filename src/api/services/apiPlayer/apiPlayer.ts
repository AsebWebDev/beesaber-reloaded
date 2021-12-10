import apiScoreSaber from '../apiScoreSaber';

import type { ScoreSaberUserInfo, UserScores } from '@/sharedTypes';

export const apiPlayer = apiScoreSaber.injectEndpoints({
  endpoints: (builder) => ({
    getRecentScoresUrl: builder.query<UserScores, string>({
      query: (id) => `/player/${id}/scores/recent/${1}`,
    }),
    getFullPlayer: builder.query<ScoreSaberUserInfo, string>({
      query: (playerName) => `player/${playerName}/full`,
    }),
  }),
});

export const { useGetFullPlayerQuery, useGetRecentScoresUrlQuery } = apiPlayer;
