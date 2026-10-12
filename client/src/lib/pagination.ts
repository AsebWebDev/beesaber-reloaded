import { useState } from 'react';

/**
 * The page number a URL asks for. Anything that is not a whole number from 1
 * up, like `?page=abc`, `?page=0` or `?page=1.5`, means the first page.
 */
const pageFrom = (value: string | null): number => {
  const page = Number(value);

  return Number.isInteger(page) && page >= 1 ? page : 1;
};

/** The number of the last page of a list. An empty list still has page 1. */
const lastPageOf = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));

/**
 * The value, or the last one there was while there is none.
 *
 * A list that fails to load has no total, and without a total the page
 * buttons would vanish and leave the user stuck on a page that does not load.
 */
const useLastKnown = <Value>(value: Value | undefined): Value | undefined => {
  const [last, setLast] = useState(value);

  // Setting state while rendering is React's way to remember a previous value
  if (value !== undefined && value !== last) setLast(value);

  return value ?? last;
};

export { lastPageOf, pageFrom, useLastKnown };
