import React from 'react';

export default function useDebounce(
  value: string,
  delay = 500
): string | undefined {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue !== '' ? debouncedValue : undefined;
}
