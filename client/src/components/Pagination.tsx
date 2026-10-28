import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './ui.tsx';

type Props = {
  onChange: (page: number) => void;
  page: number;
  totalPages: number;
};

/** Previous and next, with the position in between. Hidden for one page. */
const Pagination = ({ onChange, page, totalPages }: Props) => {
  const { t } = useTranslation();
  const previous = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  // The button pressed last, which the next page may switch off
  const pressed = useRef<HTMLButtonElement | null>(null);

  // "Next" is switched off on the last page, "Previous" on the first. A
  // switched-off button loses the focus, and the next Tab would start at
  // the top of the page. Move the focus to the other button instead.
  useEffect(() => {
    const button = pressed.current;
    const active = document.activeElement;
    const lost =
      active === null ||
      active === document.body ||
      (active === button && button.disabled);

    // Only right after a press: a page changed some other way, say by a
    // filter, leaves the focus where it is
    pressed.current = null;

    if (button !== null && lost)
      (button === next.current ? previous : next).current?.focus();
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const go = (button: HTMLButtonElement | null, to: number) => {
    pressed.current = button;
    onChange(to);
  };

  return (
    <nav
      aria-label={t('pagination.label')}
      className="flex items-center justify-center gap-4 pt-4"
    >
      <Button
        ref={previous}
        look="ghost"
        disabled={page <= 1}
        onClick={() => go(previous.current, page - 1)}
      >
        {t('pagination.previous')}
      </Button>
      <span className="text-sm text-slate-400">
        {t('pagination.position', { page, total: totalPages })}
      </span>
      <Button
        ref={next}
        look="ghost"
        disabled={page >= totalPages}
        onClick={() => go(next.current, page + 1)}
      >
        {t('pagination.next')}
      </Button>
    </nav>
  );
};

export { Pagination };
