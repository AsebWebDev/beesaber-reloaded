/* eslint-disable no-console */
import React from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import {
  // updateUserData,
  userDataUpdated,
} from 'src/store/reducer/userDataReducer';
import styled from 'styled-components';

import { errHandler } from '../../../api/api';
import api from '../../../api/authApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectIsLoggedIn,
  userIsLoggedIn,
  userIsLogginIn,
} from '../../../store/reducer/appStatusReducer';
import { mediaQuery } from '../../../tokens/definitions/layout';
import NeonButton from '../NeonButton/NeonButton';

// import type { UserData } from 'src/sharedTypes/UserData';
import type { PossibleErrors } from '../../../api/api';

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
        const { googleId, profileObj } = response;
        const userData = await api.googleLogin({ googleId, profileObj });

        if (userData === undefined) return;
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

  const onFailure = () => true;
  const logout = async () => {
    await api.logout();
    const userData = { username: null, profilePic: null };

    console.log('userData', userData);
    // dispatch({ type: 'UPDATE_USER_DATA', userdata });
    // dispatch({ type: 'LOGOUT' });
  };

  return (
    <Container>
      {!isLoggedIn && (
        <GoogleLogin
          clientId={clientId}
          render={(renderProps) => (
            <span onClick={renderProps.onClick}>
              <NeonButton text="Login" logo="google" />
            </span>
          )}
          onSuccess={onSuccess}
          onFailure={onFailure}
          isSignedIn={true}
          cookiePolicy={'single_host_origin'}
        />
      )}

      {isLoggedIn && (
        <GoogleLogout
          clientId={clientId}
          render={(renderProps) => (
            <span onClick={renderProps.onClick}>
              <NeonButton text="Logout" logo="google" />
            </span>
          )}
          onLogoutSuccess={logout}
        />
      )}
    </Container>
  );
};

export default GoogleOAuth;
