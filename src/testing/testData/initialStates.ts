import type { UserData } from '@/sharedTypes/UserData';
import type { AppStatus } from '@/store/reducer/appStatusReducer';
import type { RootState } from '@/store/store';

const appStatus: AppStatus = {
  isFetchingData: {
    status: false,
    statusText: undefined,
  },
  isLoggedIn: true,
  isLoggingIn: false,
};

const userData = {} as UserData;

const initialState: RootState = {
  appStatus,
  notifications: [],
  userData,
};

export { appStatus,userData };

export default initialState;
