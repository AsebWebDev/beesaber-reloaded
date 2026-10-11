import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { apiUser } from '@/api/services/apiUser/apiUser';
import * as hooks from '@/store/hooks';
import userDataReducer from '@/store/reducer/userDataReducer';
import setupApiStore from '@/testing/setupApiStore';
import waitForSpinnerToBeRemoved from '@/testing/waitForSpinnerToBeRemoved';

import IdInput from './IdInput';

describe('IdInput', () => {
  const spy = jest.spyOn(hooks, 'useAppSelector');

  afterAll(() => {
    spy.mockReset();
    jest.clearAllMocks();
  });

  it('should disable the save button, when ID is equal to current ID', async () => {
    const storeRef = setupApiStore(apiUser, { userData: userDataReducer });
    const idInput = '123456';

    spy.mockImplementation((selector) => {
      if (selector.name === 'selectUserId') return '123456789';
    });

    render(
      <Provider store={storeRef.store}>
        <IdInput />
      </Provider>
    );

    await waitForSpinnerToBeRemoved();

    const saveButton = screen.getByRole('button', { name: 'Save' });
    const input = screen.getByRole('textbox');

    userEvent.type(input, idInput);

    expect(input).toHaveValue(idInput);

    expect(saveButton).toBeDisabled();
  });

  it.todo('should make proper backend request on handleSave');
  it.todo('should throw error, when invalid ID is entered on save');
});
