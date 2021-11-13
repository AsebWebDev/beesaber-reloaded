import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserData } from '@/sharedTypes/UserData';
import type { ScoreData } from '@/sharedTypes/UserScores';
import type { RootState } from './rootReducer';

const name = 'userData';

const userDataActions = prefixActionType(name);

const updateUserData = createAction<UserData | string>(
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
const selectMyScoreData = (state: RootState): ScoreData =>
  state.userData.scoreData;
const selectMyScoreSaberId = (state: RootState): string | undefined =>
  state.userData.myScoreSaberId;
const selectUserData = (state: RootState): UserData => state.userData;
const selectUserId = (state: RootState): string => state.userData._id;
const selectUserName = (state: RootState): string | undefined =>
  state.userData.username;

// INITIAL STATE EXPORT
export { initialState };

// ACTIONS EXPORT
export const { userDataUpdated } = slice.actions;
export { updateUserData };

// SELECTORS EXPORT
export {
  selectMyScoreData,
  selectMyScoreSaberId,
  selectUserData,
  selectUserId,
  selectUserName,
};

// REDUCER EXPORT
export default slice.reducer;
