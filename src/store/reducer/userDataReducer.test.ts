import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import reducer, { selectUserData, userDataUpdated } from './userDataReducer';

import type { AppStatus } from 'src/store/reducer/appStatusReducer';
import type { RootState } from 'src/store/store';
import type { UserData } from '../../sharedTypes/UserData';

const middlewares = [thunk];

const appStatus: AppStatus = {
  isLoggedIn: true,
  isLoggingIn: false,
};

const initialStore: RootState = {
  appStatus,
  notifications: [],
  userData: {},
};

const exampleUserData: UserData = {
  countryRank: 111,
  county: 'Sweden',
  googleId: '123',
  password: 'myPassword',
  profilePic: 'url',
  rank: 42,
  totalPlayCount: 42,
  totalScore: 1312,
  username: 'lovenotwar',
};

const mockStore = configureMockStore(middlewares)(initialStore);

describe('userData reducer', () => {
  it('should return initialState', () => {
    const initialState: UserData = {};

    expect(reducer(undefined, { type: 'mockType' })).toStrictEqual(
      initialState
    );
  });
});

describe('selectors', () => {
  it('should select notifications', () => {
    const userData = selectUserData(exampleUserData);

    expect(userData).toStrictEqual(exampleUserData);
  });
});

describe('actions', () => {
  it('should dispatch userDataUpdated', () => {
    mockStore.dispatch(userDataUpdated(exampleUserData));
    const actions = mockStore.getActions();
    const expectedPayload = {
      type: 'userData/userDataUpdated',
      payload: exampleUserData,
    };

    expect(actions).toStrictEqual([expectedPayload]);
  });
});
