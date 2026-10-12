import { Link, useParams, useSearchParams } from 'react-router';

import { PAGE_SIZE, useComparison, useHive } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  EmptyState,
  ErrorNote,
  NeonHeading,
  Spinner,
} from '@/components/ui.tsx';
import { formatDelta, formatScore } from '@/lib/format.ts';

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
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const hive = useHive();
  const comparison = useComparison(playerId, { filter, page });
  const member = hive.data?.items.find((item) => item.player.id === playerId);

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
                : 'border-night-line text-slate-300 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {comparison.isPending && <Spinner />}
      {comparison.isError && <ErrorNote error={comparison.error} />}
      {comparison.data?.items.length === 0 && (
        <EmptyState>
          {filter === 'all'
            ? 'You have not played any of the same maps yet.'
            : 'No maps match this filter.'}
        </EmptyState>
      )}

      {comparison.data !== undefined && comparison.data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
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
              {comparison.data.items.map(({ leaderboard, mine, theirs }) => {
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
        totalPages={Math.ceil((comparison.data?.total ?? 0) / PAGE_SIZE)}
        onChange={(next) => show({ page: next })}
      />
    </div>
  );
};

export { ComparisonPage };
