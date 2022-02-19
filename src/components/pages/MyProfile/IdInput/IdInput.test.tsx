import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState as initialStore } from '@/store/store';
import exampleUserData from '@/testing/testData/exampleUserData';

import IdInput from './IdInput';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const baseUrl = 'https://new.scoresaber.com/api';

describe('IdInput', () => {
  const user = { ...exampleUserData, myScoreSaberId: '123456' };
  const store = { ...initialStore, userData: user };
  const endpointUrl = `${baseUrl}/player/${user.myScoreSaberId}/full`;

  console.log(
    '🚀 ~ file: IdInput.test.tsx ~ line 19 ~ describe ~ endpointUrl',
    endpointUrl
  );

  it('should make proper backend request on handleSave', async () => {
    const mockedStore = mockStore(store);

    render(
      <Provider store={mockedStore}>
        <IdInput />
      </Provider>
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });

    userEvent.click(saveButton);
    const actions = mockedStore.getActions();

    expect(saveButton).toBeInTheDocument();
    await waitFor(() => {
      // FIXME: Test for proper backend request
      console.log(
        '🚀 ~ file: IdInput.test.tsx ~ line 31 ~ it ~ actions',
        actions
      );

      expect(actions).toHaveLength(4);
    });
  });

  it.todo('should disable the save button, when ID is equal to current ID');

  it.todo('should throw error, when invalid ID is entered on save');

  it.todo('should match Snapshot');
});
