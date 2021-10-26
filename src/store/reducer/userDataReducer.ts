import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

import type { UserData } from '../../sharedTypes/UserData';

const name = 'userData';

const userDataActions = prefixActionType(name);

const updateUserData = createAction(userDataActions('updateUserData'));

const initialState: Record<string, unknown> | UserData = {};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    userDataUpdated: (state, action) => ({
      ...state,
      userdata: action.payload,
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
