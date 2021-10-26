import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

const name = 'userData';

const userDataActions = prefixActionType(name);

const updateUserData = createAction(userDataActions('updateUserData'));

type UserData = {
  countryRank: number;
  county: string;
  googleId: string;
  password: string;
  profilePic: string;
  rank: number;
  totalPlayCount: number;
  totalScore: number;
  username: string;
};

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

// TYPES EXPORT
export type { UserData };
