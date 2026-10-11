import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PageDirection from './PageDirection';

describe('PageDirection', () => {
  const mockOnClick = jest.fn();

  afterEach(() => jest.resetAllMocks());

  it.each(['Next', 'Previous'] as const)(
    'should match the snapshot when direction is = %s',
    (direction) => {
      const { container } = render(
        <PageDirection direction={direction} onClick={mockOnClick} />
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it('should call onClick when clicking the direction', () => {
    render(<PageDirection direction={'Next'} onClick={mockOnClick} />);

    const pageLink = screen.getByRole('link', { name: 'Next' });

    userEvent.click(pageLink);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
