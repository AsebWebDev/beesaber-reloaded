/* eslint-disable no-console */
import React from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { errHandler } from 'src/api/api';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  selectIsLoggedIn,
  userIsLoggedIn,
  userIsLogginIn,
} from 'src/store/reducer/appStatusReducer';
import { userDataUpdated } from 'src/store/reducer/userDataReducer';
import { mediaQuery } from 'src/tokens/definitions/layout';
import styled from 'styled-components';

import {
  handleLogin,
  handleLogout,
  loginProps,
  logoutProps,
} from './authHandlers';

import type { PossibleErrors } from 'src/api/api';

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

  const onSuccess = async (response: PossibleErrors) => {
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

  const onFailure = async () => {
    await logout();
    errHandler(new Error('Google login failed'));
  };

  return (
    <Container>
      {!isLoggedIn && (
        <GoogleLogin
          clientId={clientId}
          onSuccess={onSuccess}
          onFailure={onFailure}
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
