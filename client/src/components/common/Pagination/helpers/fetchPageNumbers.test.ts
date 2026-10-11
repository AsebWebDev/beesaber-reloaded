import { describe, expect, it } from 'vitest';

import fetchPageNumbers from './fetchPageNumbers';

describe('fetchPageNumbers', () => {
  it('lists every page when they all fit', () => {
    expect(
      fetchPageNumbers({ currentPage: 2, pageNeighbours: 1, totalPages: 3 })
    ).toEqual([1, 2, 3]);
  });

  it('collapses the right side on the first page', () => {
    expect(
      fetchPageNumbers({ currentPage: 1, pageNeighbours: 1, totalPages: 10 })
    ).toEqual([1, 2, 3, 4, 5, 'RIGHT', 10]);
  });

  it('collapses both sides in the middle', () => {
    expect(
      fetchPageNumbers({ currentPage: 5, pageNeighbours: 1, totalPages: 10 })
    ).toEqual([1, 'LEFT', 4, 5, 6, 'RIGHT', 10]);
  });

  it('collapses the left side on the last page', () => {
    expect(
      fetchPageNumbers({ currentPage: 10, pageNeighbours: 1, totalPages: 10 })
    ).toEqual([1, 'LEFT', 6, 7, 8, 9, 10]);
  });
});
