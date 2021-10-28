import reducer, {
  selectIsLoggedIn,
  selectIsLoggingIn,
} from './appStatusReducer';

import type { RootState } from '../store';
import type { AppStatus } from './appStatusReducer';

describe('appStatus reducer', () => {
  it('should return initialState', () => {
    const initialState: AppStatus = {
      isLoggedIn: false,
      isLoggingIn: false,
    };

    expect(reducer(undefined, { type: 'mockType' })).toStrictEqual(
      initialState
    );
  });
});

describe('selector:', () => {
  const exampleAppStatus: AppStatus = {
    isLoggedIn: true,
    isLoggingIn: false,
  };
  const mockStore: RootState = {
    notifications: [],
    appStatus: exampleAppStatus,
    userData: {},
  };

  describe('selectIsLoggedIn', () => {
    it('should select isLoggedIn', () => {
      const appStatus = selectIsLoggedIn(mockStore);

      expect(appStatus).toStrictEqual(exampleAppStatus.isLoggedIn);
    });
  });

  describe('selectIsLoggingIn', () => {
    it('should select isLoggingIn', () => {
      const appStatus = selectIsLoggingIn(mockStore);

      expect(appStatus).toStrictEqual(exampleAppStatus.isLoggingIn);
    });
  });
});
