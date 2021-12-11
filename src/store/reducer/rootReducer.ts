import { combineReducers } from '@reduxjs/toolkit';

import api from '@/api/services/api';

import appStatus from './appStatusReducer';
import notifications from './notificationsReducer';
import userData from './userDataReducer';

import type store from '../store';

type RootState = ReturnType<typeof store.getState>;

const rootReducer = combineReducers({
  appStatus,
  notifications,
  userData,
  api: api.reducer,
});

export default rootReducer;
export type { RootState };
