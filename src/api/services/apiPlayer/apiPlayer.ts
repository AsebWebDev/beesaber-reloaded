import api from '@/api/api';

import type { ScoreData, ScoreSaberUserInfo } from '@/../sharedTypes';
import type { PlayerInfo } from '@/../sharedTypes/ScoreSaberUserInfo';

const baseLocalUrl =
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

export const apiPlayer = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllScores: builder.query<ScoreData, string>({
      query: (id) => `${baseLocalUrl}/player/${id}/allscores`,
      providesTags: ['Scores'],
    }),
    getPlayerById: builder.query<ScoreSaberUserInfo, string>({
      query: (id) => `${baseLocalUrl}/player/${id}/playerbyid/`,
      providesTags: ['ScoreSaberUserInfo'],
    }),
    getPlayersByName: builder.query<PlayerInfo[], string>({
      query: (name) => `${baseLocalUrl}/player/${name}/playersbyname`,
      providesTags: ['ScoreSaberUserInfo'],
    }),
    isValidPlayerId: builder.query<boolean, string>({
      query: (id) => `${baseLocalUrl}/player/${id}/isvalidplayerid/`,
    }),
  }),
});

export const {
  useIsValidPlayerIdQuery,
  useGetAllScoresQuery,
  useGetPlayerByIdQuery,
  useGetPlayersByNameQuery,
} = apiPlayer;

export default apiPlayer;
