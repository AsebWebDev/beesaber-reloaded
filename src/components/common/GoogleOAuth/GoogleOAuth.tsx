/* eslint-disable no-console */
import React from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import styled from 'styled-components';

import { errHandler } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectIsLoggedIn,
  userIsLoggedIn,
  userIsLogginIn,
} from '@/store/reducer/appStatusReducer';
import { userDataUpdated } from '@/store/reducer/userDataReducer';
import { mediaQuery } from '@/tokens/definitions/layout';

import {
  handleLogin,
  handleLogout,
  loginProps,
  logoutProps,
} from './authHandlers';

import type { PossibleResponses } from '@/api/api';

const Container = styled.div`
  ${mediaQuery.mobile} {
    margin-top: 20px;
  }
`;

const GoogleOAuth = (): JSX.Element | null => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENTID;

  if (clientId === undefined) return null;
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  const onSuccess = async (response: PossibleResponses) => {
    dispatch(userIsLogginIn(true));
    try {
      if ('googleId' in response) {
        const userData = await handleLogin(response);

        dispatch(userDataUpdated(userData));
        dispatch(userIsLoggedIn(true));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        errHandler(error);
      }
    }
    dispatch(userIsLogginIn(false));
  };

  const logout = async () => {
    try {
      await handleLogout();
      dispatch(userIsLoggedIn(false));
      dispatch(userDataUpdated({}));
    } catch (error: unknown) {
      if (error instanceof Error) {
        errHandler(error);
      }
    }
  };

  return (
    <Container>
      {!isLoggedIn && (
        <GoogleLogin
          clientId={clientId}
          onSuccess={onSuccess}
          onFailure={() => errHandler(new Error('Google login failed'))}
          {...loginProps}
        />
      )}
      {isLoggedIn && (
        <GoogleLogout
          clientId={clientId}
          onLogoutSuccess={logout}
          {...logoutProps}
        />
      )}
    </Container>
  );
};

export default GoogleOAuth;
