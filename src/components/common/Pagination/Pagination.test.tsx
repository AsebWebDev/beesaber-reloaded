import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Pagination from './Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  afterEach(() => jest.resetAllMocks());

  it('should match the snapshot on initial view', () => {
    const { container } = render(
      <Pagination
        onPageChanged={mockOnPageChange}
        pageLimit={5}
        totalScores={30}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match the snapshot after selecting a page', () => {
    const { container } = render(
      <Pagination
        onPageChanged={mockOnPageChange}
        pageLimit={5}
        totalScores={30}
      />
    );

    const pageLink = screen.getByRole('link', { name: '3' });

    userEvent.click(pageLink);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should not render, when totalpages < 2', () => {
    const { container } = render(
      <Pagination
        onPageChanged={mockOnPageChange}
        pageLimit={30}
        totalScores={10}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render, when totalpages >= 2', () => {
    const { container } = render(
      <Pagination
        onPageChanged={mockOnPageChange}
        pageLimit={5}
        totalScores={10}
      />
    );

    expect(container).not.toBeEmptyDOMElement();
  });

  it('should call onPageChanged when selecting a page', () => {
    render(
      <Pagination
        onPageChanged={mockOnPageChange}
        pageLimit={5}
        totalScores={10}
      />
    );

    const pageLink = screen.getByRole('link', { name: '1' });

    userEvent.click(pageLink);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith({
      currentPage: 1,
      totalPages: 2,
      pageLimit: 5,
      totalScores: 10,
    });
  });

  it.each`
    direction  | text          | previousPage | nextPage
    ${'Left'}  | ${'Previous'} | ${3}         | ${2}
    ${'Right'} | ${'Next'}     | ${3}         | ${4}
  `(
    'should call handleMove$direction when clicking $direction arrow',
    ({ text, previousPage, nextPage }) => {
      render(
        <Pagination
          onPageChanged={mockOnPageChange}
          pageLimit={5}
          totalScores={50}
        />
      );

      const pageLink = screen.getByRole('link', { name: '3' });

      userEvent.click(pageLink);

      const nextLink = screen.getByRole('link', { name: text });

      userEvent.click(nextLink);

      expect(mockOnPageChange).toHaveBeenCalledTimes(2);
      expect(JSON.stringify(mockOnPageChange.mock.calls)).toStrictEqual(
        JSON.stringify([
          [
            {
              currentPage: previousPage,
              totalPages: 10,
              pageLimit: 5,
              totalScores: 50,
            },
          ],
          [
            {
              currentPage: nextPage,
              totalPages: 10,
              pageLimit: 5,
              totalScores: 50,
            },
          ],
        ])
      );
    }
  );
});
