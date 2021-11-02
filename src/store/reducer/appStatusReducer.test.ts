import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import reducer, {
  selectIsLoggedIn,
  selectIsLoggingIn,
  userIsLoggedIn,
  userIsLogginIn,
} from './appStatusReducer';

import type { UserData } from '@/sharedTypes/UserData';
import type { RootState } from '../store';
import type { AppStatus } from './appStatusReducer';

const appStatus: AppStatus = {
  isLoggedIn: false,
  isLoggingIn: false,
};

const initialStore: RootState = {
  appStatus,
  notifications: [],
  userData: {} as UserData,
};

describe('appStatus reducer', () => {
  it('should return initialState', () => {
    expect(reducer(undefined, { type: 'mockType' })).toStrictEqual(appStatus);
  });
});

describe('selector:', () => {
  describe('selectIsLoggedIn', () => {
    it('should select isLoggedIn', () => {
      const selectedAppStatus = selectIsLoggedIn(initialStore);

      expect(selectedAppStatus).toStrictEqual(appStatus.isLoggedIn);
    });
  });

  describe('selectIsLoggingIn', () => {
    it('should select isLoggingIn', () => {
      const selectedAppStatus = selectIsLoggingIn(initialStore);

      expect(selectedAppStatus).toStrictEqual(appStatus.isLoggingIn);
    });
  });
});

describe('actions', () => {
  const middlewares = [thunk];

  const mockStore = configureMockStore(middlewares)(initialStore);

  beforeEach(() => mockStore.clearActions());

  it.each([true, false])(
    'should dispatch userIsLogginIn with %s',
    (payload) => {
      mockStore.dispatch(userIsLogginIn(payload));
      const actions = mockStore.getActions();
      const expectedPayload = {
        type: 'appStatus/userIsLogginIn',
        payload,
      };

      expect(actions).toStrictEqual([expectedPayload]);
    }
  );

  it.each([true, false])(
    'should dispatch userIsLoggedIn with %s',
    (payload) => {
      mockStore.dispatch(userIsLoggedIn(payload));
      const actions = mockStore.getActions();
      const expectedPayload = {
        type: 'appStatus/userIsLoggedIn',
        payload,
      };

      expect(actions).toStrictEqual([expectedPayload]);
    }
  );
});
