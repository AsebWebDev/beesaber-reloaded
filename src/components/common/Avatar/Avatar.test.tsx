import { render, screen } from '@testing-library/react';

import exampleBee from '@/testing/testData/exampleBee';

import Avatar from './Avatar';

describe('components/common/Avatar', () => {
  const { avatar, playerName } = exampleBee;

  it('should match snapshot', () => {
    const { container } = render(
      <Avatar avatar={avatar} playerName={playerName} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it.each`
    avatar           | avatarLink
    ${'not present'} | ${undefined}
    ${'oculus'}      | ${'/images/oculus.png'}
    ${'steam'}       | ${'/images/steam.png'}
    ${'valid/link'}  | ${'valid/link'}
  `(
    'should show avatar placeholder, when avatar is $avatar',
    (avatarLink: string) => {
      render(<Avatar avatar={avatarLink} playerName={playerName} />);

      const avatarImg = screen.getByRole('img', {
        name: `Avatar of player ${playerName}`,
      }) as HTMLImageElement;

      expect(avatarImg.src).toContain(
        `https://new.scoresaber.com${avatarLink}`
      );
    }
  );
});
