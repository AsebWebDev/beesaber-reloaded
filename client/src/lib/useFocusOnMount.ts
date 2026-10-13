import { useEffect } from 'react';

import type { RefObject } from 'react';

/**
 * Moves the focus to an element when it appears, if `enabled`.
 *
 * For a screen that replaces another one, together with whatever had the
 * focus there. Without help the focus is then on nothing: a screen reader
 * stays silent, and the Tab key starts over at the top.
 *
 * The element needs `tabIndex={-1}` to be able to take the focus.
 */
const useFocusOnMount = (
  element: RefObject<HTMLElement | null>,
  enabled: boolean
) => {
  useEffect(() => {
    if (enabled) element.current?.focus();
  }, [element, enabled]);
};

export { useFocusOnMount };
