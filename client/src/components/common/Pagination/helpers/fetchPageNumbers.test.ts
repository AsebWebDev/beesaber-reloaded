import fetchPageNumbers from './fetchPageNumbers';

import type { FetchPageNumbers, PagesArray } from './fetchPageNumbers';

describe('fetchPageNumbers', () => {
  type ArgProps = Pick<
    FetchPageNumbers,
    'currentPage' | 'pageNeighbours' | 'totalPages'
  > & {
    result: PagesArray;
  };

  it.each`
    totalPages | currentPage | pageNeighbours | result
    ${5}       | ${1}        | ${1}           | ${[1, 2, 3, 4, 5]}
    ${50}      | ${2}        | ${1}           | ${[1, 2, 3, 4, 5, 'RIGHT', 50]}
    ${50}      | ${42}       | ${1}           | ${[1, 'LEFT', 41, 42, 43, 'RIGHT', 50]}
    ${50}      | ${42}       | ${4}           | ${[1, 'LEFT', 38, 39, 40, 41, 42, 43, 44, 45, 46, 'RIGHT', 50]}
  `(
    'should return correct page numbers array for $totalPages total Pages, current page: $currentPage and $pageNeighbours page neigbours',
    ({ currentPage, pageNeighbours, totalPages, result }: ArgProps) => {
      const pageData: FetchPageNumbers = {
        currentPage,
        pageNeighbours,
        totalPages,
      };

      expect(fetchPageNumbers(pageData)).toStrictEqual(result);
    }
  );
});
