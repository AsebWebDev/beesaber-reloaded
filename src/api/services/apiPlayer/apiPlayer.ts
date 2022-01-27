import api from '../api';

import type { Scores, ScoreSaberUserInfo, UserScores } from '@/sharedTypes';
import type { PlayerInfo } from '@/sharedTypes/ScoreSaberUserInfo';

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
    getPlayersByName: builder.query<PlayerInfo[], string>({
      query: (name) => `${baseUrl}/players/by-name/${name}`,
      transformResponse: (response: { players: PlayerInfo[] }) =>
        response.players,
      providesTags: ['PlayerInfo'],
    }),
  }),
});

export const {
  useGetFullPlayerQuery,
  useGetPlayersByNameQuery,
  useGetRecentScoresUrlQuery,
} = apiPlayer;
