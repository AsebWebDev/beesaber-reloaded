import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { apiUser } from '@/api/services/apiUser/apiUser';
import * as hooks from '@/store/hooks';
import userDataReducer from '@/store/reducer/userDataReducer';
import setupApiStore from '@/testing/setupApiStore';
import { examplePlayerInfos } from '@/testing/testData/exampleSSUserInfo';

import FoundPlayersList from './FoundPlayersList';

describe('FoundPlayersList', () => {
  const storeRef = setupApiStore(apiUser, { userData: userDataReducer });
  const spy = jest.spyOn(hooks, 'useAppSelector');

  it('should render found players, when players are found', async () => {
    spy.mockImplementation((test) => {
      if (test.name === 'selectUserId') return '12345678';
      else return 'something else';
    });

    render(
      <Provider store={storeRef.store}>
        <FoundPlayersList foundPlayers={examplePlayerInfos} />
      </Provider>
    );

    const elem = await screen.findByTestId('found-players-list');

    expect(elem).toBeInTheDocument();
  });

  it.todo('should match snapshot for one found players');
  it.todo(
    'should not render, when no players are found or userdata is undefined'
  );
  it.todo('should mark found player correctly as already added');
  it.todo('should mark correctly as only one user found');
});
