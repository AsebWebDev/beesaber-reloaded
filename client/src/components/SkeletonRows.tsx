type Props = {
  /** How many columns the table has, the map column included */
  columns: number;
  /** How many rows to stand in for. Use what was shown before, if anything. */
  rows: number;
};

const bar = 'bg-night-line rounded motion-safe:animate-pulse';

/**
 * Grey placeholder rows for a table whose content is on its way. They have
 * the shape of the real rows, so nothing jumps when the content arrives.
 *
 * Hidden from screen readers; the table announces loading through a status
 * message of its own.
 */
const SkeletonRows = ({ columns, rows }: Props) =>
  Array.from({ length: rows }, (_, row) => (
    <tr
      key={row}
      aria-hidden="true"
      data-testid="skeleton-row"
      className="border-night-line border-t"
    >
      <td className="w-full max-w-0 px-2 py-2">
        <div className="flex items-center gap-3">
          <div className={`${bar} size-11 shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`${bar} h-3 w-2/5`} />
            <div className={`${bar} h-2.5 w-3/5`} />
          </div>
        </div>
      </td>
      {Array.from({ length: columns - 1 }, (_, column) => (
        <td key={column} className="px-2 py-2">
          <div className={`${bar} ml-auto h-3 w-16`} />
        </td>
      ))}
    </tr>
  ));

export { SkeletonRows };
