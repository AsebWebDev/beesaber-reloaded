import { useEffect, useState } from 'react';
// import '../styles/Pagination.scss';

type Page = number | string;

type PaginationData = {
  currentPage: number;
  pageLimit: number;
  totalPages: number;
  totalScores: number;
};

type PaginationProps = Pick<PaginationData, 'pageLimit' | 'totalScores'> & {
  onPageChanged: (paginationData: PaginationData) => void;
  pageNeighbours?: number;
};

type FetchPageNumbersProps = Required<
  Pick<PaginationData, 'currentPage' | 'totalPages'>
> &
  Required<Pick<PaginationProps, 'pageNeighbours'>>;

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

const fetchPageNumbers = ({
  currentPage,
  pageNeighbours,
  totalPages,
}: FetchPageNumbersProps) => {
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

const Pagination = ({
  onPageChanged,
  pageLimit = 30,
  pageNeighbours = 0,
  totalScores,
}: PaginationProps): JSX.Element | null => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(
    Math.ceil(totalScores / pageLimit)
  );

  // pageNeighbours can be: 0, 1 or 2
  pageNeighbours = Math.max(0, Math.min(pageNeighbours, 2));

  const pages = fetchPageNumbers({ currentPage, pageNeighbours, totalPages });

  const gotoPage = (page: Page): void => {
    const newCurrentPage = Math.max(0, Math.min(Number(page), totalPages));
    const paginationData = {
      currentPage,
      totalPages,
      pageLimit,
      totalScores,
    };

    onPageChanged(paginationData);

    setCurrentPage(newCurrentPage);
  };

  const handleClick = (
    page: Page | string,
    evt: React.MouseEvent<HTMLElement>
  ) => {
    evt.preventDefault();
    gotoPage(page);
  };

  const handleMoveLeft = (evt: React.MouseEvent<HTMLElement>) => {
    evt.preventDefault();
    gotoPage(currentPage - pageNeighbours * 2 - 1);
  };

  const handleMoveRight = (evt: React.MouseEvent<HTMLElement>) => {
    evt.preventDefault();
    gotoPage(currentPage + pageNeighbours * 2 + 1);
  };

  useEffect(() => {
    gotoPage(1);
  }, []);

  useEffect(() => {
    setTotalPages(Math.ceil(totalScores / pageLimit));
  }, [totalScores]);

  if (totalPages < 2) return null;

  return (
    <div id="pagination">
      <>
        <nav aria-label="Scores Pagination">
          <ul className="pagination">
            {pages.map((page, index) => {
              if (page === LEFT_PAGE)
                return (
                  <li key={index} className="page-item">
                    <a
                      className="page-link"
                      href="/#"
                      aria-label="Previous"
                      onClick={handleMoveLeft}
                    >
                      <span aria-hidden="true">&laquo;</span>
                      <span className="sr-only">Previous</span>
                    </a>
                  </li>
                );

              if (page === RIGHT_PAGE)
                return (
                  <li key={index} className="page-item">
                    <a
                      className="page-link"
                      href="/#"
                      aria-label="Next"
                      onClick={handleMoveRight}
                    >
                      <span aria-hidden="true">&raquo;</span>
                      <span className="sr-only">Next</span>
                    </a>
                  </li>
                );

              return (
                <li
                  key={index}
                  className={`page-item${
                    currentPage === page ? ' active' : ''
                  }`}
                >
                  <a
                    className="page-link"
                    href="/#"
                    onClick={(e) => handleClick(page, e)}
                  >
                    {page}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </>
    </div>
  );
};

export default Pagination;
