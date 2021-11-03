import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import Header from './Header';

import type { UserData } from '@/sharedTypes/UserData';
import type { AppStatus } from '@/store/reducer/appStatusReducer';
import type { RootState } from '@/store/store';

const mockStore = configureMockStore();

const appStatus: AppStatus = {
  isLoggedIn: true,
  isLoggingIn: false,
};

const store: RootState = {
  appStatus,
  notifications: [],
  userData: {} as UserData,
};

describe('Header', () => {
  it('should match the snapshot', () => {
    const { container } = render(
      <Provider store={mockStore(store)}>
        <Header />
      </Provider>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});

test.todo('show / hide spinner when (no) fetch in progress');
test.todo('match snapshot spinner true/false');
