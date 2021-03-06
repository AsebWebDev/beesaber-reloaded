import { render, screen } from '@testing-library/react';

import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';

import OnePlayer from './OnePlayer';

const player = exampleSSUserInfo.playerInfo;

describe('OnePlayer', () => {
  it.each`
    amount        | isOnlyResult
    ${'one'}      | ${true}
    ${'multiple'} | ${false}
  `(
    'should match snapshot for $amount found player(s)',
    (isOnlyResult: boolean) => {
      render(
        <table>
          <tbody>
            <OnePlayer
              handleSelect={jest.fn()}
              player={player}
              isAlreadyAdded={false}
              isOnlyResult={isOnlyResult}
            />
          </tbody>
        </table>
      );

      const component = screen.getByRole('row');

      expect(component).toMatchSnapshot();
    }
  );

  it('should show icon, when multiple players are found', () => {
    render(
      <table>
        <tbody>
          <OnePlayer
            handleSelect={jest.fn()}
            player={player}
            isAlreadyAdded={false}
            isOnlyResult={false}
          />
        </tbody>
      </table>
    );

    const selectableIcon = screen.queryByTestId('select-icon');

    expect(selectableIcon).toBeInTheDocument();
  });

  it('should hide icon, when only one player is found', () => {
    render(
      <table>
        <tbody>
          <OnePlayer
            handleSelect={jest.fn()}
            player={player}
            isAlreadyAdded={false}
            isOnlyResult={true}
          />
        </tbody>
      </table>
    );

    const selectableIcon = screen.queryByTestId('select-icon');

    expect(selectableIcon).not.toBeInTheDocument();
  });

  it('should hide icon, when player is already added', () => {
    render(
      <table>
        <tbody>
          <OnePlayer
            handleSelect={jest.fn()}
            player={player}
            isAlreadyAdded={true}
            isOnlyResult={false}
          />
        </tbody>
      </table>
    );

    const lastCell = screen.getByRole('row').lastChild?.firstChild; // grabs last cell in row

    expect(lastCell).toBeNull();
  });

  it('should call handleSelect, when icon clicked', () => {
    const mockHandleSelect = jest.fn();

    render(
      <table>
        <tbody>
          <OnePlayer
            handleSelect={mockHandleSelect}
            player={player}
            isAlreadyAdded={false}
            isOnlyResult={false}
          />
        </tbody>
      </table>
    );

    const selectableIcon = screen.getByTestId('select-icon');

    selectableIcon.click();

    expect(mockHandleSelect).toHaveBeenCalledTimes(1);
  });
});
