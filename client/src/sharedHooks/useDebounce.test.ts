import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useDebounce from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the new value only after the delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 600),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');
  });

  it('starts the delay again with every change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 600),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('abc');
  });

  it('returns undefined for an empty value', () => {
    const { result } = renderHook(() => useDebounce('', 600));

    expect(result.current).toBeUndefined();
  });
});
