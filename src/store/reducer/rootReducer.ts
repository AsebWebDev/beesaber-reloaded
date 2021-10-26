import { combineReducers } from '@reduxjs/toolkit';

import appStatus from './appStatusReducer';
import notifications from './notificationsReducer';
import userData from './userDataReducer';

const rootReducer = combineReducers({
  appStatus,
  notifications,
  userData,
});

type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
export type { RootState };
