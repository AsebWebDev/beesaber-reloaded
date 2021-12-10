import api from '../api';

import type { UserData } from '@/sharedTypes';

export const apiUser = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserData: builder.query<UserData, string>({
      query: (userId) => `/user/${userId}`,
    }),
  }),
});

export const { useGetUserDataQuery } = apiUser;
