import type { UserData } from '@/sharedTypes/UserData';
import type { AppStatus } from '@/store/reducer/appStatusReducer';
import type { RootState } from '@/store/store';

const appStatus: AppStatus = {
  isLoggedIn: true,
  isLoggingIn: false,
};

const userData = {} as UserData;

const store: RootState = {
  appStatus,
  notifications: [],
  userData,
};

export default store;
