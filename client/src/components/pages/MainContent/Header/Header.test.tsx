import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as hooks from '@/sharedHooks/useLoadingState';
import { initialState as initialStore } from '@/store/store';

import Header from './Header';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Header', () => {
  it.each([true, false])(
    'should match snapshot, when is component is fetching=%s',
    (isFetching) => {
      const extendedStore = Object.assign(initialStore, {
        userData: {
          _id: '2141234124',
        },
      });

      jest.spyOn(hooks, 'default').mockReturnValue(isFetching);

      const { container } = render(
        <Provider store={mockStore(extendedStore)}>
          <Header />
        </Provider>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
