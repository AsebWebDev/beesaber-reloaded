import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { PAGE_SIZE, useComparison, useHive } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { SkeletonRows } from '@/components/SkeletonRows.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
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
  const comparison = useComparison(playerId, { filter, page });
  const member = hive.data?.items.find((item) => item.player.id === playerId);
  const items = comparison.data?.items ?? [];

  usePageTitle(
    member === undefined ? 'Comparison' : `Me vs ${member.player.name}`
  );
  const lastPage = lastPageOf(
    useLastKnown(comparison.data?.total) ?? 0,
    PAGE_SIZE
  );
  // A link to page 9 of a list that has three: go to the last one there is
  const beyondTheEnd =
    comparison.data !== undefined &&
    !comparison.isPlaceholderData &&
    page > lastPage;
  // Loading for the first time, or showing the previous list while the one
  // for a new filter or page is on its way. A list that failed is not
  // loading: what there is stays on screen, with the error above it.
  const loading =
    !comparison.isError &&
    (comparison.isPending || comparison.isPlaceholderData || beyondTheEnd);

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

  return (
    <div className="space-y-6">
      <Link to="/hive" className="text-sm text-slate-400 hover:underline">
        ← My hive
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        {member !== undefined && (
          <Avatar
            src={member.player.avatarUrl}
            name={member.player.name}
            size={56}
          />
        )}
        <div>
          <NeonHeading color="red" className="text-3xl">
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
      {loading && (
        <p role="status" className="sr-only">
          Loading comparison
        </p>
      )}
      {!loading && !comparison.isError && items.length === 0 && (
        <EmptyState>
          {filter === 'all'
            ? 'You have not played any of the same maps yet.'
            : 'No maps match this filter.'}
        </EmptyState>
      )}

      {(loading || items.length > 0) && (
        <div className="overflow-x-auto">
          <table
            aria-busy={loading}
            className="w-full min-w-[40rem] text-left text-sm"
          >
            <thead className="text-neon-yellow-core text-xs tracking-wider uppercase">
              <tr>
                <th scope="col" className="px-2 py-2 font-semibold">
                  Map
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  Me
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  {member?.player.name ?? 'Them'}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonRows columns={4} rows={items.length || 8} />}
              {!loading &&
                items.map(({ leaderboard, mine, theirs }) => {
                  const delta = mine.modifiedScore - theirs.modifiedScore;

                  return (
                    <tr
                      key={leaderboard.id}
                      className="border-night-line border-t"
                    >
                      <td className="w-full max-w-0 px-2 py-2">
                        <Song leaderboard={leaderboard} />
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatScore(mine.modifiedScore)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatScore(theirs.modifiedScore)}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold tabular-nums ${
                          delta > 0
                            ? 'text-neon-blue-core'
                            : delta < 0
                              ? 'text-neon-red-core'
                              : 'text-slate-400'
                        }`}
                      >
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
