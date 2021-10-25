import { combineReducers } from '@reduxjs/toolkit';

import notifications from './notificationsReducer';
import userData from './userDataReducer';

const rootReducer = combineReducers({
  notifications,
  userData,
});

type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
export type { RootState };
