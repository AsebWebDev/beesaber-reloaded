import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import PrivateRoute from './PrivateRoute';

import type { UserData } from '@/sharedTypes/UserData';
import type { AppStatus } from '@/store/reducer/appStatusReducer';
import type { RootState } from '@/store/store';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const appStatus: AppStatus = {
  isLoggedIn: true,
  isLoggingIn: false,
};

const store: RootState = {
  appStatus,
  notifications: [],
  userData: {} as UserData,
};

describe('PrivateRoute', () => {
  const history = createMemoryHistory();
  const Component = <div>Test Component</div>;
  let path: string;

  beforeEach(() => {
    path = '/somepath';
    history.push(path);
  });

  it('should render component on given route when logged in', () => {
    render(
      <Provider store={mockStore(store)}>
        <Router history={history}>
          <PrivateRoute path={path} component={() => Component} />
        </Router>
      </Provider>
    );

    const component = screen.getByText('Test Component');

    expect(history.location.pathname).toBe(path);
    expect(component).toBeInTheDocument();
  });

  it('should redirect to "/" when not logged in', () => {
    store.appStatus.isLoggedIn = false;
    render(
      <Provider store={mockStore(store)}>
        <Router history={history}>
          <PrivateRoute path={path} component={() => Component} />
        </Router>
      </Provider>
    );

    const component = screen.queryByText('Test Component');

    expect(history.location.pathname).toBe('/');
    expect(component).not.toBeInTheDocument();
  });
});
