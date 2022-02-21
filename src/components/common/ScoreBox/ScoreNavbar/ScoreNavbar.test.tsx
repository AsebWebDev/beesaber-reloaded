import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScoreNavbar from './ScoreNavbar';

import type { NavTabs } from '../ScoreBox';

describe('ScoreNavbar', () => {
  it.each(['RECENT', 'TOP'] as const)(
    'should match the snapshot when activeItem is %s',
    (activeItem) => {
      const { container } = render(
        <ScoreNavbar
          activeItem={activeItem}
          setIsPlayedByHive={jest.fn()}
          toggleTab={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it.each`
    name        | activeItem
    ${'Recent'} | ${'RECENT'}
    ${'Top'}    | ${'TOP'}
  `(
    'should call toggleTab with $activeItem when $name is clicked',
    ({ activeItem, name }: { activeItem: NavTabs; name: string }) => {
      const mockedToggleTab = jest.fn();

      render(
        <ScoreNavbar
          activeItem={activeItem}
          setIsPlayedByHive={jest.fn()}
          toggleTab={mockedToggleTab}
        />
      );

      const item = screen.getByRole('tab', { name });

      userEvent.click(item);
      expect(mockedToggleTab).toHaveBeenCalledTimes(1);
      expect(mockedToggleTab).toHaveBeenCalledWith(activeItem);
    }
  );

  it('should call setIsPlayedByHive when toggle is clicked', () => {
    const mockedSetIsPlayedByHive = jest.fn();

    render(
      <ScoreNavbar
        activeItem={'RECENT'}
        setIsPlayedByHive={mockedSetIsPlayedByHive}
        toggleTab={jest.fn()}
      />
    );

    const toggle = screen.getByRole('checkbox');

    userEvent.click(toggle);
    expect(mockedSetIsPlayedByHive).toHaveBeenCalledTimes(1);
  });
});
