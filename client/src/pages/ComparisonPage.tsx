import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { PAGE_SIZE, useComparison, useHive } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { SkeletonRows } from '@/components/SkeletonRows.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  CellLabel,
  EmptyState,
  ErrorNote,
  NeonHeading,
} from '@/components/ui.tsx';
import { formatDelta, formatScore } from '@/lib/format.ts';
import { lastPageOf, pageFrom, useLastKnown } from '@/lib/pagination.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

import type { ComparisonFilter } from '@/api/queries.ts';

const FILTERS: { label: string; value: ComparisonFilter }[] = [
  { value: 'all', label: 'All shared maps' },
  { value: 'losing', label: 'Where I am behind' },
  { value: 'winning', label: 'Where I am ahead' },
];

const isFilter = (value: string | null): value is ComparisonFilter =>
  FILTERS.some((filter) => filter.value === value);

/**
 * Me against one bee: every map we both played, with both scores.
 *
 * Filter and page live in the URL (`?filter=losing&page=2`), so the view
 * survives a reload and can be shared as a link.
 */
const ComparisonPage = () => {
  const { playerId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('filter');
  const filter = isFilter(requested) ? requested : 'all';
  const page = pageFrom(searchParams.get('page'));

  const hive = useHive();
  const member = hive.data?.items.find((item) => item.player.id === playerId);
  // The hive is known, and this player is not in it: an old link, a typo in
  // the address, or a bee that was removed in the meantime
  const notInHive = hive.data !== undefined && member === undefined;
  const comparison = useComparison(playerId, { filter, page }, !notInHive);
  const items = comparison.data?.items ?? [];
  const total = comparison.data?.total;
  const tableName = `Scores of me and ${member?.player.name ?? 'this bee'}`;
  // While a list loads or has failed it has no total and no rows. What was
  // there before keeps the page buttons and the height of the table.
  const lastPage = lastPageOf(useLastKnown(total) ?? 0, PAGE_SIZE);
  const rowsBefore = useLastKnown(comparison.data?.items.length);
  // A link to page 9 of a list that has three: go to the last one there is
  const beyondTheEnd = total !== undefined && page > lastPage;
  // True for the first load and for every new filter or page. A list that
  // failed is not loading: what there is stays on screen, with the error
  // above it.
  const loading = comparison.isPending || beyondTheEnd;

  usePageTitle(
    notInHive
      ? 'Not in your hive'
      : member === undefined
        ? 'Comparison'
        : `Me vs ${member.player.name}`
  );

  useEffect(() => {
    if (beyondTheEnd)
      setSearchParams({ filter, page: String(lastPage) }, { replace: true });
  }, [beyondTheEnd, filter, lastPage, setSearchParams]);

  const show = (next: { filter?: ComparisonFilter; page?: number }) =>
    setSearchParams({
      filter: next.filter ?? filter,
      // A new filter starts on its first page
      page: String(next.filter === undefined ? (next.page ?? page) : 1),
    });

  if (notInHive)
    return (
      <div className="space-y-6">
        <NeonHeading color="red" className="text-3xl">
          Not in your hive
        </NeonHeading>
        <EmptyState>
          You can only compare with players in your hive, and this one is not.{' '}
          <Link to="/hive" className="text-neon-yellow-core underline">
            Go to my hive
          </Link>{' '}
          to add them.
        </EmptyState>
      </div>
    );

  return (
    <div className="space-y-6">
      <Link
        to="/hive"
        className="inline-block text-sm text-slate-400 hover:underline"
      >
        ← My hive
      </Link>

      {/* Picture and title stay side by side, also on a phone: the title
          wraps within its own column instead of dropping below the picture */}
      <header className="flex items-center gap-3 sm:gap-4">
        {member !== undefined && (
          <Avatar src={member.player.avatarUrl} size={56} />
        )}
        <div className="min-w-0">
          <NeonHeading color="red" className="text-2xl break-words sm:text-3xl">
            Me vs {member?.player.name ?? '…'}
          </NeonHeading>
          {member !== undefined && (
            <p className="text-sm text-slate-400">
              {member.shared} shared maps · you lead on {member.winning}, they
              lead on {member.losing}
            </p>
          )}
        </div>
      </header>

      <div role="group" aria-label="Filter" className="flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => show({ filter: value })}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
              filter === value
                ? 'border-neon-blue bg-neon-blue text-white'
                : 'border-night-control text-slate-300 hover:border-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {comparison.isError && (
        <ErrorNote
          error={comparison.error}
          onRetry={() => void comparison.refetch()}
        />
      )}
      {/* Always there, so that a change of its text is read out: first
          that the list is loading, then what has arrived */}
      <p role="status" className="sr-only">
        {loading
          ? 'Loading comparison'
          : total === undefined
            ? ''
            : `${total} ${total === 1 ? 'map' : 'maps'} in this list${
                lastPage > 1 ? `, page ${page} of ${lastPage}` : ''
              }.`}
      </p>
      {!loading && !comparison.isError && items.length === 0 && (
        <EmptyState>
          {filter === 'all'
            ? 'You have not played any of the same maps yet.'
            : 'No maps match this filter.'}
        </EmptyState>
      )}

      {(loading || items.length > 0) && (
        // On a narrow screen the table scrolls sideways. A scrolling area
        // has to be reachable with the keyboard, or its right half is not.
        <div
          role="region"
          aria-label={tableName}
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table
            role="table"
            aria-busy={loading}
            // On a phone every row folds into two lines: the song, and
            // below it the values. The roles say what the elements are,
            // since a browser may forget once CSS changes how they are laid out.
            className="w-full text-left text-sm max-sm:block sm:min-w-[40rem]"
          >
            <caption className="sr-only">{tableName}</caption>
            <thead
              role="rowgroup"
              className="text-neon-yellow-core text-xs tracking-wider uppercase max-sm:sr-only"
            >
              <tr role="row">
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 font-semibold"
                >
                  Map
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  Me
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  {member?.player.name ?? 'Them'}
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  Difference
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="max-sm:block">
              {loading && <SkeletonRows columns={4} rows={rowsBefore || 8} />}
              {!loading &&
                items.map(({ leaderboard, mine, theirs }) => {
                  const delta = mine.modifiedScore - theirs.modifiedScore;

                  return (
                    <tr
                      role="row"
                      key={leaderboard.id}
                      className="border-night-line border-t max-sm:flex max-sm:flex-wrap max-sm:pb-1"
                    >
                      <td
                        role="cell"
                        className="w-full max-w-0 px-2 py-2 max-sm:max-w-none max-sm:basis-full"
                      >
                        <Song leaderboard={leaderboard} />
                      </td>
                      <td
                        role="cell"
                        className="px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                      >
                        <CellLabel>Me</CellLabel>
                        {formatScore(mine.modifiedScore)}
                      </td>
                      <td
                        role="cell"
                        className="px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                      >
                        <CellLabel>{member?.player.name ?? 'Them'}</CellLabel>
                        {formatScore(theirs.modifiedScore)}
                      </td>
                      <td
                        role="cell"
                        className={`px-2 py-2 text-right font-semibold tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left ${
                          delta > 0
                            ? 'text-neon-blue-core'
                            : delta < 0
                              ? 'text-neon-red-core'
                              : 'text-slate-400'
                        }`}
                      >
                        <CellLabel>Difference</CellLabel>
                        {formatDelta(delta)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={lastPage}
        onChange={(next) => show({ page: next })}
      />
    </div>
  );
};

export { ComparisonPage };
