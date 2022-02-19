import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as useIsMobile from '@/sharedHooks/useIsMobile';
import { initialState as store } from '@/store/store';

import Menu from './Menu';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('components/pages/Menu', () => {
  let spy: jest.Mock | jest.SpyInstance<{ isMobile: boolean }, []>;

  beforeEach(() => {
    spy = jest.fn();
    spy = jest.spyOn(useIsMobile, 'default');
  });

  afterEach(() => {
    spy.mockRestore();
    spy.mockReset();
  });

  it.each([true, false])(
    'should match snapshot when isMobile is %sw',
    (isMobile) => {
      spy.mockReturnValue({ isMobile });

      const { container } = render(
        <Router>
          <Provider store={mockStore(store)}>
            <Menu />
          </Provider>
        </Router>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
