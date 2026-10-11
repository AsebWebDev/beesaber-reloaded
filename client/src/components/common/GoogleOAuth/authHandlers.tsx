import { toast } from 'react-toastify';

import { apiAuth } from '@/api/services/apiAuth/apiAuth';
import store from '@/store/store';

import NeonGoogleButton from './NeonGoogleButton/NeonGoogleButton';

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

const handleLogout = async (): Promise<void> => {
  await toast.promise(store.dispatch(apiAuth.endpoints.logout.initiate()), {
    pending: 'Loggin you out ...',
    success: 'You successfully logged out 👌',
    error: 'There has been an issue logging you out 🤯',
  });
};

export type { RenderPropsType };

export { handleLogout, loginProps, logoutProps };
