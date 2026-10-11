import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PageNumber from './PageNumber';

describe('PageNumber', () => {
  const mockGotoPage = jest.fn();

  afterEach(() => jest.resetAllMocks());

  it.each([true, false])(
    'should match the snapshot when isActive = %s',
    (isActive) => {
      const { container } = render(
        <PageNumber gotoPage={mockGotoPage} page={5} isActive={isActive} />
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it('should call gotoPage when clicking the page', () => {
    const page = 5;

    render(<PageNumber gotoPage={mockGotoPage} page={page} isActive={false} />);

    const pageLink = screen.getByRole('link', { name: '5' });

    userEvent.click(pageLink);

    expect(mockGotoPage).toHaveBeenCalledTimes(1);
    expect(mockGotoPage).toHaveBeenCalledWith(page);
  });
});
