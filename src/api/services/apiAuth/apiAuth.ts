/* eslint-disable @typescript-eslint/no-invalid-void-type */
import api from '@/api/api';

import type { GooglePayload, GoogleUserData } from '@/../sharedTypes';

const baseUrl =
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

export const apiAuth = api.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation<GoogleUserData, GooglePayload>({
      query: (payload) => ({
        url: `${baseUrl}/googlelogin`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: ({
        _id,
        googleImageUrl,
        googleName,
        myScoreSaberId,
        profilePic,
        username,
      }) => ({
        _id,
        googleImageUrl,
        googleName,
        myScoreSaberId,
        profilePic,
        username,
      }),
    }),
    googleLogout: builder.mutation<undefined, void>({
      query: () => ({
        url: `${baseUrl}/logout`,
        method: 'POST',
      }),
      invalidatesTags: ['UserData'],
    }),
    isValidMongoId: builder.query<boolean, string>({
      query: (id) => ({
        url: `${baseUrl}/checkValidMongoId/${id}`,
        method: 'GET',
      }),
    }),
    logout: builder.query<undefined, void>({
      query: () => ({
        url: `${baseUrl}/logout`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGoogleLoginMutation,
  useGoogleLogoutMutation,
  useIsValidMongoIdQuery,
  useLogoutQuery,
} = apiAuth;

export default apiAuth;
