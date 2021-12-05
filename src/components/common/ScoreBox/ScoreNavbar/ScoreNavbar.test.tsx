import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScoreNavbar from './ScoreNavbar';

import type { NavTabs } from '../ScoreBox';

describe('ScoreNavbar', () => {
  it.each(['RECENT', 'TOP'] as const)(
    'should match the snapshot when activeitem is %s',
    (activeitem) => {
      const { container } = render(
        <ScoreNavbar
          activeitem={activeitem}
          setIsPlayedByHive={jest.fn()}
          toggleTab={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it.each`
    name        | activeitem
    ${'Recent'} | ${'RECENT'}
    ${'Top'}    | ${'TOP'}
  `(
    'should call toggleTab with $activeitem when $name is clicked',
    ({ activeitem, name }: { activeitem: NavTabs; name: string }) => {
      const mockedToggleTab = jest.fn();

      render(
        <ScoreNavbar
          activeitem={activeitem}
          setIsPlayedByHive={jest.fn()}
          toggleTab={mockedToggleTab}
        />
      );

      const item = screen.getByRole('tab', { name });

      userEvent.click(item);
      expect(mockedToggleTab).toHaveBeenCalledTimes(1);
      expect(mockedToggleTab).toHaveBeenCalledWith(activeitem);
    }
  );

  it('should call setIsPlayedByHive when toggle is clicked', () => {
    const mockedSetIsPlayedByHive = jest.fn();

    render(
      <ScoreNavbar
        activeitem={'RECENT'}
        setIsPlayedByHive={mockedSetIsPlayedByHive}
        toggleTab={jest.fn()}
      />
    );

    const toggle = screen.getByRole('checkbox');

    userEvent.click(toggle);
    expect(mockedSetIsPlayedByHive).toHaveBeenCalledTimes(1);
  });
});
