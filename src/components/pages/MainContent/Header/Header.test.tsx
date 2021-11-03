import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import { initialState as store } from '@/store/store';

import Header from './Header';

const mockStore = configureMockStore();

describe('Header', () => {
  it.each([true, false])('should match the snapshot', (status) => {
    store.appStatus.isFetchingData = {
      status,
      statusText: undefined,
    };

    const { container } = render(
      <Provider store={mockStore(store)}>
        <Header />
      </Provider>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  // it('should show spinner, when is fetching', () => {
  //   render(
  //     <Provider store={mockStore(store)}>
  //       <Header />
  //     </Provider>
  //   );

  //   expect(container.firstChild).toMatchSnapshot();
  // });
});

test.todo('show / hide spinner when (no) fetch in progress');
test.todo('match snapshot spinner true/false');
