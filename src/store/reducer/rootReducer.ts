import { combineReducers } from '@reduxjs/toolkit';

import api from '@/api/services/api';
import apiScoreSaber from '@/api/services/apiScoreSaber';

import appStatus, {
  initialState as appStatusInitialState,
} from './appStatusReducer';
import notifications, {
  initialState as notificationsInitialState,
} from './notificationsReducer';
import userData, {
  initialState as userDataInitialState,
} from './userDataReducer';

const rootReducer = combineReducers({
  appStatus,
  notifications,
  userData,
  [apiScoreSaber.reducerPath]: apiScoreSaber.reducer,
  [api.reducerPath]: api.reducer,
});

const initialState: RootState = {
  appStatus: { ...appStatusInitialState },
  notifications: { ...notificationsInitialState },
  userData: { ...userDataInitialState },
};

type RootState = Pick<
  ReturnType<typeof rootReducer>,
  'appStatus' | 'notifications' | 'userData'
>;

export { initialState };
export default rootReducer;
export type { RootState };
