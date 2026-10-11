import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as useIsMobile from '@/sharedHooks/useIsMobile';
import { initialState as store } from '@/store/store';

import App from './App';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('App', () => {
  let spy: jest.Mock | jest.SpyInstance<{ isMobile: boolean }, []>;

  beforeEach(() => {
    spy = jest.fn();
    spy = jest.spyOn(useIsMobile, 'default');
  });

  afterEach(() => {
    spy.mockRestore();
    spy.mockReset();
  });

  it('should show scrollDown indicator on mobile view', () => {
    spy.mockReturnValue({ isMobile: true });

    render(
      <Provider store={mockStore(store)}>
        <Router>
          <App />
        </Router>
      </Provider>
    );
    const indicator = screen.getByTestId('indicator');

    expect(indicator).toBeInTheDocument();
  });

  it('should now show scrollDown indicator on larger screens', () => {
    spy.mockReturnValue({ isMobile: false });

    render(
      <Provider store={mockStore(store)}>
        <Router>
          <App />
        </Router>
      </Provider>
    );
    const indicator = screen.queryByTestId('indicator');

    expect(indicator).not.toBeInTheDocument();
  });

  it('should show menu when logged in', () => {
    const expandedStore = { ...store, appStatus: { isLoggedIn: true } };

    render(
      <Provider store={mockStore(expandedStore)}>
        <Router>
          <App />
        </Router>
      </Provider>
    );

    const menu = screen.getByTestId('menu');

    expect(menu).toBeInTheDocument();
  });

  it('should hide menu when not logged in', () => {
    const expandedStore = { ...store, appStatus: { isLoggedIn: false } };

    render(
      <Provider store={mockStore(expandedStore)}>
        <Router>
          <App />
        </Router>
      </Provider>
    );

    const menu = screen.queryByTestId('menu');

    expect(menu).not.toBeInTheDocument();
  });
});
