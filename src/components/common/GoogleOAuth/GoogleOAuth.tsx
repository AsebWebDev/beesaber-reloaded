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
import { mediaQuery } from '@/tokens/definitions/layout';

import { loginProps, logoutProps } from './authHandlers';

import type {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';
import type { GoogleUserData } from '@/sharedTypes';

const Container = styled.div`
  ${mediaQuery.mobile} {
    margin-top: 20px;
  }
`;

const GoogleOAuth = (): JSX.Element | null => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENTID;

  if (clientId === undefined) return null;
  const dispatch = useAppDispatch();
  const history = useHistory();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [loginGoogle, { isLoading: isLoggingIn }] = useGoogleLoginMutation();
  const [logoutGoogle, { isSuccess }] = useGoogleLogoutMutation();

  const onSuccess = async (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
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
