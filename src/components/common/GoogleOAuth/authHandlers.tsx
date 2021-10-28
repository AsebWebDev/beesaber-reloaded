import { toast } from 'react-toastify';

import api from '../../../api/authApi';
import NeonGoogleButton from './NeonGoogleButton/NeonGoogleButton';

import type { GoogleLoginResponse } from 'react-google-login';
import type { UserData } from '../../../sharedTypes/UserData';

type RenderPropsType = {
  disabled?: boolean | undefined;
  onClick: () => void;
};

const loginProps = {
  render: (renderProps: RenderPropsType): JSX.Element => (
    <NeonGoogleButton text={'Login'} {...renderProps} />
  ),
  isSignedIn: true,
  cookiePolicy: 'single_host_origin',
};

const logoutProps = {
  render: (renderProps: RenderPropsType): JSX.Element => (
    <NeonGoogleButton text={'Logout'} {...renderProps} />
  ),
};

const handleLogin = async (
  response: GoogleLoginResponse
): Promise<UserData> => {
  const { googleId, profileObj } = response;
  const userData = await toast.promise<UserData>(
    api.googleLogin({ googleId, profileObj }),
    {
      pending: 'Loggin you in ...',
      success: 'You successfully logged in 👌',
      error: 'There has been an issue logging you in 🤯',
    }
  );

  return userData;
};

const handleLogout = async (): Promise<void> => {
  await toast.promise(api.logout(), {
    pending: 'Loggin you out ...',
    success: 'You successfully logged out 👌',
    error: 'There has been an issue logging you out 🤯',
  });
};

export type { RenderPropsType };

export { handleLogin, handleLogout, loginProps, logoutProps };
