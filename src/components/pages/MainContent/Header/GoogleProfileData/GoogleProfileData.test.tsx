import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import { initialState as store } from '@/store/store';

import GoogleProfileData from './GoogleProfileData';

const mockStore = configureMockStore();

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
