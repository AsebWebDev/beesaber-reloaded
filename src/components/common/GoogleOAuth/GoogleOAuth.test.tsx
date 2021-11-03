import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import initialState from '@/testing/testData/initialStates';

import GoogleOAuth from './GoogleOAuth';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

process.env.REACT_APP_GOOGLE_CLIENTID = 'fakeGoogleClientId';

describe('GoogleOAuth', () => {
  it.each([true, false])(
    'should match snapshot when isLoggedIn=%s',
    (isLoggedIn) => {
      initialState.appStatus.isLoggedIn = isLoggedIn;
      const { container } = render(
        <Provider store={mockStore(initialState)}>
          <GoogleOAuth />
        </Provider>
      );

      expect(container).toMatchSnapshot();
    }
  );

  it.todo('should redirect, when logging out');
  // FIXME: mocked click event does not seem to trigger history push
  // eslint-disable-next-line jest/no-commented-out-tests
  // it('should redirect, when logging out', async () => {
  //   const history = createMemoryHistory();
  //   const path = '/somepath';

  //   history.push(path);
  //   const spy = jest.spyOn(history, 'push')

  //   store.appStatus.isLoggedIn = true;
  //   render(
  //     <Router history={history}>
  //       <Provider store={mockStore(store)}>
  //         <GoogleOAuth />
  //       </Provider>
  //     </Router>
  //   );

  //   const logoutButton = await screen.findByRole('button', { name: 'Logout' });

  //   fireEvent.click(logoutButton);
  //   expect(spy).toBeCalledTimes(1)
  //   expect(history.location.pathname).toBe('/');
  // });
});
