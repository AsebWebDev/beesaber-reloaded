import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { RootState } from '../store';

const name = 'appStatus';

const appStatusActions = prefixActionType(name);

const isLoggingIn = createAction(appStatusActions('isLoggingIn'));

type AppStatus = {
  isLoggingIn: boolean;
};

const initialState: AppStatus = {
  isLoggingIn: false,
};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    userIsLogginIn: (state, action) => ({
      ...state,
      appStatus: {
        isLoggingIn: action.payload,
      },
    }),
  },
});

// SELECTORS
const selectIsLoggingIn = (state: RootState): boolean =>
  state.appStatus.isLoggingIn;

// ACTIONS EXPORT
export const { userIsLogginIn } = slice.actions;
export { isLoggingIn };

// SELECTORS EXPORT
export { selectIsLoggingIn };

// REDUCER EXPORT
export default slice.reducer;

// TYPES EXPORT
export type { AppStatus };
