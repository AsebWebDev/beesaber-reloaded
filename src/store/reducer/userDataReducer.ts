import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserData } from '../../sharedTypes/UserData';

const name = 'userData';

const userDataActions = prefixActionType(name);

const updateUserData = createAction<UserData | undefined>(
  userDataActions('updateUserData')
);

const initialState: UserData = {};

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
const selectUserData = (state: UserData): UserData => state;

// ACTIONS EXPORT
export const { userDataUpdated } = slice.actions;
export { updateUserData };

// SELECTORS EXPORT
export { selectUserData };

// REDUCER EXPORT
export default slice.reducer;
