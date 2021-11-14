import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import ScoreHeader from './ScoreHeader';

const mockStore = configureMockStore();

describe('ScoreHeader', () => {
  const mockOnChange = jest.fn();

  it.each(['MyUserName', undefined])(
    'should match the snapshot',
    (username) => {
      const store = {
        userData: {
          username,
        },
      };

      const { container } = render(
        <Provider store={mockStore(store)}>
          <ScoreHeader onChange={mockOnChange} query={'some query'} />
        </Provider>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it('should call onChange when typing a query', () => {
    const store = {
      userData: {
        username: 'MyUserName',
      },
    };
    const someQuery = 'word';

    render(
      <Provider store={mockStore(store)}>
        <ScoreHeader onChange={mockOnChange} query={'some query'} />
      </Provider>
    );

    const input = screen.getByRole('textbox');

    userEvent.type(input, someQuery);

    expect(mockOnChange).toBeCalledTimes(4);
  });
});
