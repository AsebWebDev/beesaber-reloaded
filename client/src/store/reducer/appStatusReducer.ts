import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const name = 'appStatus';

const appStatusActions = prefixActionType(name);

const isFetchingData = createAction(appStatusActions('isFetchingData'));
const isLoggingIn = createAction(appStatusActions('isLoggingIn'));
const isLoggedIn = createAction(appStatusActions('isLoggedIn'));

type AppStatus = {
  isFetchingData: IsFetchingData;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
};

type IsFetchingData = {
  status: boolean;
  statusText?: string;
};

const initialState: AppStatus = {
  isLoggedIn: false,
  isLoggingIn: false,
  isFetchingData: {
    status: false,
    statusText: undefined,
  },
};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    userIsFetchingData: (
      state,
      { payload }: PayloadAction<IsFetchingData>
    ) => ({
      ...state,
      isFetchingData: payload,
    }),
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
const selectIsFetchingData = (state: RootState): IsFetchingData =>
  state.appStatus.isFetchingData;

const selectIsLoggingIn = (state: RootState): boolean =>
  state.appStatus.isLoggingIn;

const selectIsLoggedIn = (state: RootState): boolean =>
  state.appStatus.isLoggedIn;

// INITIAL STATE EXPORT
export { initialState };

// ACTIONS EXPORT
export const { userIsFetchingData, userIsLogginIn, userIsLoggedIn } =
  slice.actions;
export { isFetchingData, isLoggedIn, isLoggingIn };

// SELECTORS EXPORT
export { selectIsFetchingData, selectIsLoggedIn, selectIsLoggingIn };

// REDUCER EXPORT
export default slice.reducer;

// TYPES EXPORT
export type { AppStatus, IsFetchingData };
