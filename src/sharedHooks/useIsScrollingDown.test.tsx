import { renderHook } from '@testing-library/react-hooks';

import useIsScrollingDown from './useIsScrollingDown';

describe('useIsScrollingDown', () => {
  it('should return false when initialised (aka not scrolled yet)', () => {
    const { result } = renderHook(() => useIsScrollingDown());

    expect(result.current.isScrollingDown).toBe(false);
  });
});

test.todo('should return true when scrolled down');
// Mocking a scroll down in jest seems to be a little difficult
