import api from '../api';

import type { Scores, ScoreSaberUserInfo, UserScores } from '@/sharedTypes';

const baseUrl = 'https://new.scoresaber.com/api';

export const apiPlayer = api.injectEndpoints({
  endpoints: (builder) => ({
    getRecentScoresUrl: builder.query<Scores, { count: number; id: string }>({
      query: ({ id, count = 1 }) =>
        `${baseUrl}/player/${id}/scores/recent/${count}`,
      transformResponse: (response: UserScores) => response.scores,
      providesTags: ['Scores'],
    }),
    getFullPlayer: builder.query<ScoreSaberUserInfo, string>({
      query: (id) => `${baseUrl}/player/${id}/full`,
      providesTags: ['ScoreSaberUserInfo'],
    }),
  }),
});

export const { useGetFullPlayerQuery, useGetRecentScoresUrlQuery } = apiPlayer;
