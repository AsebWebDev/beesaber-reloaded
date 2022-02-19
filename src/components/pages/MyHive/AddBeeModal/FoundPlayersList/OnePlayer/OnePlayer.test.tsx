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

  it.each`
    amount        | isOnlyResult | icon
    ${'one'}      | ${true}      | ${'minus'}
    ${'multiple'} | ${false}     | ${'plus'}
  `(
    'should show $icon icon, when $amount player(s) found',
    ({
      icon,
      isOnlyResult,
    }: {
      icon: 'minus' | 'plus';
      isOnlyResult: boolean;
    }) => {
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

      const selectableIcon = screen.getByTestId('select-icon');

      expect(selectableIcon).toHaveClass(`fa-${icon}-circle`);
    }
  );
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

  it.each`
    avatar           | avatarLink
    ${'not present'} | ${undefined}
    ${'oculus'}      | ${'/images/oculus.png'}
    ${'steam'}       | ${'/images/steam.png'}
  `(
    'should show avatar placeholder, when avatar is $avatar',
    (avatarLink: string) => {
      const mockedPlayer = { ...player, avatar: avatarLink };

      render(
        <table>
          <tbody>
            <OnePlayer
              handleSelect={jest.fn()}
              player={mockedPlayer}
              isAlreadyAdded={false}
              isOnlyResult={false}
            />
          </tbody>
        </table>
      );

      const avatar = screen.getByRole('img', {
        name: `Avatar of player ${mockedPlayer.playerName}`,
      }) as HTMLImageElement;

      expect(avatar.src).toContain(`https://new.scoresaber.com${avatarLink}`);
    }
  );

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
