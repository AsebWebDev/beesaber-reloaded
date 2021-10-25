import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

const name = 'userData';

const userDataActions = prefixActionType(name);

const addNotification = createAction(userDataActions('updateUserData'));

type UserData = {
  username: String;
  password: String;
  googleId: String;
  profilePic: String;
  totalPlayCount: Number;
  totalScore: Number;
  county: String;
  rank: Number;
  countryRank: Number;
};

const initialState: UserData | {} = {};

const slice = createSlice({
  name,
  initialState,
  reducers: {
    userDataUpdated: (state, action) => {
      return {
        ...state,
        userdata: action.payload,
      };
    },
  },
});

// SELECTORS
const selectUserData = (state: UserData): UserData => state;

// ACTIONS EXPORT
export const { userDataUpdated } = slice.actions;
export { addNotification };

// SELECTORS EXPORT
export { selectUserData };

// REDUCER EXPORT
export default slice.reducer;

// TYPES EXPORT
export type { UserData };
