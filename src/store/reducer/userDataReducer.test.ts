import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import exampleUserData from '../../testing/testData/exampleUserData';
import reducer, { selectUserData, userDataUpdated } from './userDataReducer';

import type { AppStatus } from '@/store/reducer/appStatusReducer';
import type { RootState } from '@/store/store';
import type { UserData } from '../../sharedTypes/UserData';

const middlewares = [thunk];

const appStatus: AppStatus = {
  isLoggedIn: true,
  isLoggingIn: false,
};

const initialStore: RootState = {
  appStatus,
  notifications: [],
  userData: exampleUserData,
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
    const userData = selectUserData(initialStore);

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
