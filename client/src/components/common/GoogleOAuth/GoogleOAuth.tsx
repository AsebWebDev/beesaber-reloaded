import type { JSX } from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import errHandler from '@/api/errHandler';
import {
  useGoogleLoginMutation,
  useGoogleLogoutMutation,
} from '@/api/services/apiAuth/apiAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectIsLoggedIn,
  userIsLoggedIn,
  userIsLogginIn,
} from '@/store/reducer/appStatusReducer';
import { userDataUpdated } from '@/store/reducer/userDataReducer';
import { exampleGooglePayLoad } from '@/testing/testData/exampleGoogleData';
import { mediaQuery } from '@/tokens/definitions/layout';

import { loginProps, logoutProps } from './authHandlers';
import NeonGoogleButton from './NeonGoogleButton/NeonGoogleButton';

import type {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';
import type { GooglePayload, GoogleUserData } from '@beesaber/shared';

const Container = styled.div`
  ${mediaQuery.mobile} {
    margin-top: 20px;
  }
`;

// TEMPORARY: react-google-login no longer works, Google shut down the library
// it wraps. Until the new login exists, mock mode offers a login without
// Google that is answered by the msw handlers.
const isMockMode = import.meta.env.VITE_MSW === 'enabled';

const GoogleOAuth = (): JSX.Element | null => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENTID;
  const dispatch = useAppDispatch();
  const history = useHistory();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [loginGoogle, { isLoading: isLoggingIn }] = useGoogleLoginMutation();
  const [logoutGoogle, { isSuccess }] = useGoogleLogoutMutation();

  const onSuccess = async (
    response: GoogleLoginResponse | GoogleLoginResponseOffline | GooglePayload
  ) => {
    dispatch(userIsLogginIn(isLoggingIn));
    if ('googleId' in response) {
      const { googleId, profileObj } = response;

      const userData = await toast.promise<GoogleUserData>(
        loginGoogle({ googleId, profileObj }).unwrap(),
        {
          pending: 'Loggin you in ...',
          success: 'You successfully logged in 👌',
          error: 'There has been an issue logging you in 🤯',
        }
      );

      dispatch(userDataUpdated(userData));
      dispatch(userIsLoggedIn(true));
    }
    dispatch(userIsLogginIn(isLoggingIn));
  };

  const logout = async () => {
    history.push('/');

    await toast.promise(logoutGoogle(), {
      pending: 'Loggin you out ...',
      success: 'You successfully logged out 👋',
      error: 'There has been an issue logging you out 🤯',
    });
    dispatch(userIsLoggedIn(isSuccess));
  };

  if (isMockMode)
    return (
      <Container>
        {!isLoggedIn && (
          <NeonGoogleButton
            text={'Dev Login'}
            onClick={() => void onSuccess(exampleGooglePayLoad)}
          />
        )}
        {isLoggedIn && (
          <NeonGoogleButton text={'Logout'} onClick={() => void logout()} />
        )}
      </Container>
    );

  if (clientId === undefined) return null;

  return (
    <Container>
      {!isLoggedIn && (
        <GoogleLogin
          clientId={clientId}
          // react-google-login does not work with this rule:
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSuccess={onSuccess}
          onFailure={() => errHandler(new Error('Google login failed'))}
          {...loginProps}
        />
      )}
      {isLoggedIn && (
        <GoogleLogout
          clientId={clientId}
          // react-google-login does not work with this rule:
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onLogoutSuccess={logout}
          {...logoutProps}
        />
      )}
    </Container>
  );
};

export default GoogleOAuth;
