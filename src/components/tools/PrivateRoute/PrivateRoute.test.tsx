import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';

import api from '../../../api/api';
import PrivateRoute from './PrivateRoute';

describe('PrivateRoute', () => {
  const history = createMemoryHistory();
  const Component = <div>Test Component</div>;
  const spy = jest.spyOn(api.authApi, 'isLoggedIn');
  let path: string;

  beforeEach(() => {
    path = '/somepath';
    history.push(path);
  });

  afterEach(() => {
    spy.mockReset();
  });

  it('should render component on given route when logged in', () => {
    spy.mockReturnValue(true);

    render(
      <Router history={history}>
        <PrivateRoute path={path} component={() => Component} />
      </Router>
    );

    const component = screen.getByText('Test Component');

    expect(spy).toBeCalledTimes(1);
    expect(history.location.pathname).toBe(path);
    expect(component).toBeInTheDocument();
  });

  it('should redirect to "/" when not logged in', () => {
    spy.mockReturnValue(false);

    render(
      <Router history={history}>
        <PrivateRoute path={path} component={() => Component} />
      </Router>
    );

    const component = screen.queryByText('Test Component');

    expect(spy).toBeCalledTimes(1);
    expect(history.location.pathname).toBe('/');
    expect(component).not.toBeInTheDocument();
  });
});
