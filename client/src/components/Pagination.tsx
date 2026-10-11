import { Button } from './ui.tsx';

type Props = {
  onChange: (page: number) => void;
  page: number;
  totalPages: number;
};

/** Previous and next, with the position in between. Hidden for one page. */
const Pagination = ({ onChange, page, totalPages }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pages"
      className="flex items-center justify-center gap-4 pt-4"
    >
      <Button
        look="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </span>
      <Button
        look="ghost"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
};

export { Pagination };
