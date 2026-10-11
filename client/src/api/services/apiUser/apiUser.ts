import api from '@/api/api';

import type { UserData } from '@beesaber/shared';

type UpdateUserDataArgs = {
  userData: Partial<UserData>;
  userId: string;
};

type DeleteBeeArgs = {
  playerId: string;
  userId: string;
};

export const apiUser = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyScoreSaberId: builder.query<string, string>({
      query: (userId) => `user/${userId}`,
      providesTags: ['UserData'],
      transformResponse: (response: UserData) => response.myScoreSaberId,
    }),
    getTotalPlayCount: builder.query<number, string>({
      query: (userId) => `user/${userId}`,
      providesTags: ['UserData'],
      transformResponse: (response: UserData) =>
        response.totalPlayCount !== undefined ? response.totalPlayCount : 0,
    }),
    getUserData: builder.query<UserData, string>({
      query: (userId) => `user/${userId}`,
      providesTags: ['UserData'],
    }),
    updateUserData: builder.mutation<UserData, UpdateUserDataArgs>({
      query: ({ userId, userData }) => ({
        url: `user/${userId}`,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['UserData'],
    }),
    deleteBee: builder.mutation<boolean, DeleteBeeArgs>({
      query: ({ userId, playerId }) => ({
        url: `user/${userId}/bee/delete`,
        method: 'POST',
        body: { playerId },
      }),
      invalidatesTags: ['UserData'],
    }),
  }),
});

export const {
  useGetTotalPlayCountQuery,
  useGetMyScoreSaberIdQuery,
  useGetUserDataQuery,
  useDeleteBeeMutation,
  useUpdateUserDataMutation,
} = apiUser;
