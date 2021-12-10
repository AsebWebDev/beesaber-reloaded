import api from '../api';

import type { GoggleUserData } from '@/sharedTypes';

type GooglePayload = {
  googleId: string;
  profileObj: {
    email: string;
    familyName: string;
    givenName: string;
    googleId: string;
    imageUrl: string;
    name: string;
  };
};

export const apiAuth = api.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation<GoggleUserData, GooglePayload>({
      query: (payload) => ({
        url: `/googlelogin`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: ({
        _id,
        profilePic,
        username,
        googleName,
        googleImageUrl,
      }) => ({
        _id,
        profilePic,
        username,
        googleName,
        googleImageUrl,
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    googleLogout: builder.mutation<undefined, void>({
      query: () => ({
        url: `/logout`,
        method: 'POST',
      }),
    }),
  }),
});

export const { useGoogleLoginMutation, useGoogleLogoutMutation } = apiAuth;
