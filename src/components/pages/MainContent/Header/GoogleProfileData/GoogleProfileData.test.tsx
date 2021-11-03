import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import GoogleProfileData from './GoogleProfileData';

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

describe('GoogleProfileData', () => {
  it('should match the snapshot', () => {
    const { container } = render(
      <Provider store={mockStore(store)}>
        <GoogleProfileData />
      </Provider>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});

test.todo('should show fallpack, when no profile picture exists');
test.todo('should show profile picture');
test.todo('match snapshot when logged in');
