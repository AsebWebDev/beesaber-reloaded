import api from '@/api/api';

import type { GooglePayload, GoogleUserData } from '@beesaber/shared';

export const apiAuth = api.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation<GoogleUserData, GooglePayload>({
      query: (payload) => ({
        url: `googlelogin`,
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
      }: GoogleUserData) => ({
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
        url: `logout`,
        method: 'POST',
      }),
      invalidatesTags: ['UserData'],
    }),
    isValidMongoId: builder.query<boolean, string>({
      query: (id) => ({
        url: `checkValidMongoId/${id}`,
        method: 'GET',
      }),
    }),
    logout: builder.query<undefined, void>({
      query: () => ({
        url: `logout`,
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
