import type { PaginationData, PaginationProps } from '../Pagination';

const LEFT_PAGE = 'LEFT';
const RIGHT_PAGE = 'RIGHT';

const range = (from: number, to: number, step = 1): number[] => {
  let i = from;
  const rangeArr: number[] = [];

  while (i <= to) {
    rangeArr.push(i);
    i += step;
  }

  return rangeArr;
};

type FetchPageNumbersProps = Required<
  Pick<PaginationData, 'currentPage' | 'totalPages'>
> &
  Required<Pick<PaginationProps, 'pageNeighbours'>>;

const fetchPageNumbers = ({
  currentPage,
  pageNeighbours,
  totalPages,
}: FetchPageNumbersProps): Array<number | string> => {
  const totalNumbers = pageNeighbours * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (totalPages > totalBlocks) {
    let pages = [];

    const leftBound = currentPage - pageNeighbours;
    const rightBound = currentPage + pageNeighbours;
    const beforeLastPage = totalPages - 1;

    const startPage = leftBound > 2 ? leftBound : 2;
    const endPage = rightBound < beforeLastPage ? rightBound : beforeLastPage;

    pages = range(startPage, endPage);

    const pagesCount = pages.length;
    const singleSpillOffset = totalNumbers - pagesCount - 1;

    const leftSpill = startPage > 2;
    const rightSpill = endPage < beforeLastPage;

    const leftSpillPage = LEFT_PAGE;
    const rightSpillPage = RIGHT_PAGE;

    if (leftSpill && !rightSpill) {
      const extraPages = range(startPage - singleSpillOffset, startPage - 1);

      pages = [leftSpillPage, ...extraPages, ...pages];
    } else if (!leftSpill && rightSpill) {
      const extraPages = range(endPage + 1, endPage + singleSpillOffset);

      pages = [...pages, ...extraPages, rightSpillPage];
    } else if (leftSpill && rightSpill) {
      pages = [leftSpillPage, ...pages, rightSpillPage];
    }

    return [1, ...pages, totalPages];
  }

  return range(1, totalPages);
};

export default fetchPageNumbers;
