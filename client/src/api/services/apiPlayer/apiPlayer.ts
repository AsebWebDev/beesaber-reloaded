import api from '@/api/api';

import type { ScoreData, ScoreSaberUserInfo } from '@beesaber/shared';
import type { PlayerInfo } from '@beesaber/shared/ScoreSaberUserInfo';

export const apiPlayer = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllScores: builder.query<ScoreData, string>({
      query: (id) => `player/${id}/allscores`,
      providesTags: ['Scores'],
    }),
    getPlayerById: builder.query<ScoreSaberUserInfo, string>({
      query: (id) => `player/${id}/playerbyid/`,
      providesTags: ['ScoreSaberUserInfo'],
    }),
    getPlayersByName: builder.query<PlayerInfo[], string>({
      query: (name) => `player/${name}/playersbyname`,
      providesTags: ['ScoreSaberUserInfo'],
    }),
    isValidPlayerId: builder.query<boolean, string>({
      query: (id) => `player/${id}/isvalidplayerid/`,
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
