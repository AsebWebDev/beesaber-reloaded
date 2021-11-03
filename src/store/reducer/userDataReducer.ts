import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserData } from '@/sharedTypes/UserData';
import type { RootState } from './rootReducer';

const name = 'userData';

const userDataActions = prefixActionType(name);

const updateUserData = createAction<UserData | undefined>(
  userDataActions('updateUserData')
);

const initialState = {} as UserData;

const slice = createSlice({
  name,
  initialState,
  reducers: {
    userDataUpdated: (state, { payload }: PayloadAction<UserData>) => ({
      ...state,
      ...payload,
    }),
  },
});

// SELECTORS
const selectUserData = (state: RootState): UserData => state.userData;
const selectMyScoreSaberId = (state: RootState): string =>
  state.userData.myScoreSaberId;

// INITIAL STATE EXPORT
export { initialState };

// ACTIONS EXPORT
export const { userDataUpdated } = slice.actions;
export { updateUserData };

// SELECTORS EXPORT
export { selectMyScoreSaberId, selectUserData };

// REDUCER EXPORT
export default slice.reducer;
