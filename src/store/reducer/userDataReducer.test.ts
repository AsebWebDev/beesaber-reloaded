import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState as initialStore } from '@/store/store';
import exampleUserData from '@/testing/testData/exampleUserData';

import reducer, { selectUserData, userDataUpdated } from './userDataReducer';

import type { UserData } from '@/sharedTypes/UserData';
import type { RootState } from '@/store/store';

const middlewares = [thunk];

const mockStore = configureMockStore(middlewares)(initialStore);

describe('userData reducer', () => {
  it('should return initialState', () => {
    const initialState = {} as UserData;

    expect(reducer(undefined, { type: 'mockType' })).toStrictEqual(
      initialState
    );
  });
});

describe('selectors', () => {
  initialStore.userData = exampleUserData;
  it('should select userData', () => {
    const userData = selectUserData(initialStore as RootState);

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
