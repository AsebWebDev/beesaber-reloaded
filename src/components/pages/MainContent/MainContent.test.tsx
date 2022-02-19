import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState as store } from '@/store/store';

import MainContent from './MainContent';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('components/pages/MainContent', () => {
  const mockedStore = { ...store };

  it('should render LandingPage, when not logged in', () => {
    mockedStore.appStatus.isLoggedIn = false;
    render(
      <Router>
        <Provider store={mockStore(mockedStore)}>
          <MainContent />
        </Provider>
      </Router>
    );
    const landingPage = screen.getByTestId('landing-page');

    expect(landingPage).toBeInTheDocument();
  });
  it('should render Dashboard, when logged in', () => {
    mockedStore.appStatus.isLoggedIn = true;
    render(
      <Router>
        <Provider store={mockStore(mockedStore)}>
          <MainContent />
        </Provider>
      </Router>
    );
    const dashboard = screen.getByText('Dashboard');

    expect(dashboard).toBeInTheDocument();
  });
});
