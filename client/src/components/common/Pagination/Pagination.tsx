import { useEffect, useState } from 'react';
import styled from 'styled-components';

import fetchPageNumbers from './helpers/fetchPageNumbers';
import PageDirection from './PageDirection/PageDirection';
import PageNumber from './PageNumber/PageNumber';

const LEFT_PAGE = 'LEFT';
const RIGHT_PAGE = 'RIGHT';

const Container = styled('nav').attrs({ ariaLabel: 'Scores Pagination' })``;

const PageNavigation = styled('ul')`
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  list-style-type: none;
  margin-bottom: 0;
  margin-top: 0;
`;

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

const Pagination = ({
  onPageChanged,
  pageLimit = 30,
  pageNeighbours = 0,
  totalScores,
}: PaginationProps): JSX.Element | null => {
  pageNeighbours = Math.max(0, Math.min(pageNeighbours, 2)); // pageNeighbours can be: 0, 1 or 2
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(
    Math.ceil(totalScores / pageLimit)
  );

  const pages = fetchPageNumbers({ currentPage, pageNeighbours, totalPages });

  const gotoPage = (page: number): void => {
    const paginationData = {
      currentPage: page,
      totalPages,
      pageLimit,
      totalScores,
    };

    onPageChanged(paginationData);
    setCurrentPage(page);
  };

  const handleMoveLeft = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    gotoPage(currentPage - pageNeighbours * 2 - 1);
  };

  const handleMoveRight = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    gotoPage(currentPage + pageNeighbours * 2 + 1);
  };

  useEffect(() => {
    setTotalPages(Math.ceil(totalScores / pageLimit));
  }, [totalScores]);

  if (totalPages < 2) return null;

  return (
    <Container>
      <PageNavigation>
        {pages.map((page) => {
          const key = `page${page}`;

          if (page === LEFT_PAGE)
            return (
              <PageDirection
                key={key}
                onClick={handleMoveLeft}
                direction="Previous"
              />
            );

          if (page === RIGHT_PAGE)
            return (
              <PageDirection
                key={key}
                onClick={handleMoveRight}
                direction="Next"
              />
            );

          return (
            <PageNumber
              key={key}
              gotoPage={gotoPage}
              isActive={currentPage === page}
              page={Number(page)}
            />
          );
        })}
      </PageNavigation>
    </Container>
  );
};

export type { PaginationData, PaginationProps };

export default Pagination;
