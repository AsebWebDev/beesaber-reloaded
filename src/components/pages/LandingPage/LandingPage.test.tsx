import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState as store } from '@/store/store';

import LandingPage from './LandingPage';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('LandingPage', () => {
  it.each([[false, true]])(
    'should match the snapshot when isLoggingIn is %s',
    (isLoggingIn) => {
      store.appStatus.isLoggingIn = isLoggingIn;
      const { container } = render(
        <Provider store={mockStore(store)}>
          <LandingPage />
        </Provider>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
