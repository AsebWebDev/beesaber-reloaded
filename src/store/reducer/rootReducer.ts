import { combineReducers } from '@reduxjs/toolkit';

import notifications from './notificationsReducer';

const rootReducer = combineReducers({
  notifications
});

type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
export type { RootState };
