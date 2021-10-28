import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import GoogleOAuth from './GoogleOAuth';

import type { AppStatus } from 'src/store/reducer/appStatusReducer';
import type { RootState } from 'src/store/store';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const appStatus: AppStatus = {
  isLoggedIn: true,
  isLoggingIn: false,
};

const store: RootState = {
  appStatus,
  notifications: [],
  userData: {},
};

process.env.REACT_APP_GOOGLE_CLIENTID = 'fakeGoogleClientId';

describe('GoogleOAuth', () => {
  it.each([true, false])(
    'should match snapshot when isLoggedIn=%s',
    (isLoggedIn) => {
      store.appStatus.isLoggedIn = isLoggedIn;
      const { container } = render(
        <Provider store={mockStore(store)}>
          <GoogleOAuth />
        </Provider>
      );

      expect(container).toMatchSnapshot();
    }
  );
});
