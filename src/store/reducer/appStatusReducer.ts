import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const name = 'appStatus';

const appStatusActions = prefixActionType(name);

const isLoggingIn = createAction(appStatusActions('isLoggingIn'));
const isLoggedIn = createAction(appStatusActions('isLoggedIn'));

type AppStatus = {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
};

const initialState: AppStatus = {
  isLoggedIn: false,
  isLoggingIn: false,
};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    userIsLogginIn: (state, { payload }: PayloadAction<boolean>) => ({
      ...state,
      isLoggingIn: payload,
    }),
    userIsLoggedIn: (state, { payload }: PayloadAction<boolean>) => ({
      ...state,
      isLoggedIn: payload,
    }),
  },
});

// SELECTORS
const selectIsLoggingIn = (state: RootState): boolean =>
  state.appStatus.isLoggingIn;

const selectIsLoggedIn = (state: RootState): boolean =>
  state.appStatus.isLoggedIn;

// ACTIONS EXPORT
export const { userIsLogginIn, userIsLoggedIn } = slice.actions;
export { isLoggedIn, isLoggingIn };

// SELECTORS EXPORT
export { selectIsLoggedIn, selectIsLoggingIn };

// REDUCER EXPORT
export default slice.reducer;

// TYPES EXPORT
export type { AppStatus };
