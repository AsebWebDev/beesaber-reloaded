import api from '../api';

import type { GoogleUserData } from '@/sharedTypes';

const baseUrl =
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

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
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    googleLogout: builder.mutation<undefined, void>({
      query: () => ({
        url: `${baseUrl}/logout`,
        method: 'POST',
      }),
      invalidatesTags: ['UserData'],
    }),
  }),
});

export const { useGoogleLoginMutation, useGoogleLogoutMutation } = apiAuth;
