import { useEffect, useState } from 'react';

/**
 * Follows `value`, but only after it has stopped changing for `delayMs`.
 * Used so a search runs when the user pauses, not on every keystroke.
 */
const useDebouncedValue = <Value>(value: Value, delayMs = 400): Value => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};

export { useDebouncedValue };
