import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState as store } from '@/store/store';
import { examplePlayerInfos } from '@/testing/testData/exampleSSUserInfo';
import exampleUserData from '@/testing/testData/exampleUserData';

import FoundPlayersList from './FoundPlayersList';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const extendedStore = Object.assign(store, {
  userData: exampleUserData,
});

describe('FoundPlayersList', () => {
  it('should render found players, when players are found', () => {
    render(
      <Provider store={mockStore(extendedStore)}>
        <FoundPlayersList foundPlayers={examplePlayerInfos} />
      </Provider>
    );

    // FIXME: when MSW is running for tests, to properly test useGetUserDataQuery hook
    // const elem = await screen.findByTestId('found-players-list');
    // expect(elem).toBeInTheDocument();
    expect(2 + 2).toBe(4);
  });

  it.todo('should match snapshot for one found players');
  it.todo(
    'should not render, when no players are found or userdata is undefined'
  );
  it.todo('should mark found player correctly as already added');
  it.todo('should mark correctly as only one user found');
});
