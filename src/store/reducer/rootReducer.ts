import { combineReducers } from '@reduxjs/toolkit';

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
});

const initialState: RootState = {
  appStatus: { ...appStatusInitialState },
  notifications: { ...notificationsInitialState },
  userData: { ...userDataInitialState },
};

type RootState = ReturnType<typeof rootReducer>;

export { initialState };
export default rootReducer;
export type { RootState };
