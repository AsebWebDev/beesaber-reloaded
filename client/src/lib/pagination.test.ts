import { describe, expect, it } from 'vitest';

import { lastPageOf, pageFrom } from './pagination.ts';

describe('the page number in an address', () => {
  it('is the number asked for when it is a whole number from 1 up', () => {
    expect(pageFrom('1')).toBe(1);
    expect(pageFrom('7')).toBe(7);
  });

  it('is the first page for anything else', () => {
    for (const value of [null, '', 'abc', '0', '-2', '1.5'])
      expect(pageFrom(value)).toBe(1);
  });

  it('is the first page for a number too large to count with exactly', () => {
    // The server refuses such a page, and with that answer the page would
    // never learn how many pages there are
    expect(pageFrom('1e20')).toBe(1);
    expect(pageFrom('9007199254740993')).toBe(1);
  });
});

describe('the last page of a list', () => {
  it('has room for everything, and is page 1 for an empty list', () => {
    expect(lastPageOf(0, 20)).toBe(1);
    expect(lastPageOf(20, 20)).toBe(1);
    expect(lastPageOf(21, 20)).toBe(2);
  });
});
