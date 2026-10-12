import { useId, useState } from 'react';

import { PAGE_SIZE, useScores } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { SkeletonRows } from '@/components/SkeletonRows.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorNote,
  NeonHeading,
} from '@/components/ui.tsx';
import {
  countryFlag,
  formatAccuracy,
  formatRank,
  formatScore,
  timeAgo,
} from '@/lib/format.ts';
import { useDebouncedValue } from '@/lib/useDebouncedValue.ts';

import type { Player, ScoreSort } from '@/api/queries.ts';

const SORTS: { label: string; value: ScoreSort }[] = [
  { value: 'recent', label: 'Latest' },
  { value: 'top', label: 'Highest score' },
];

/** My ScoreSaber profile and my scores, searchable and sortable */
const ProfilePage = ({ player }: { player: Player }) => {
  const searchId = useId();
  const [sort, setSort] = useState<ScoreSort>('recent');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(text.trim());
  const scores = useScores(player.id, { page, search, sort });
  // Loading for the first time, or showing the previous list while the one
  // for a new sort order, search or page is on its way
  const loading = scores.isPending || scores.isPlaceholderData;
  const items = scores.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar src={player.avatarUrl} name={player.name} size={72} />
        <div>
          <NeonHeading color="blue" className="text-3xl">
            {player.name}
          </NeonHeading>
          <p className="text-sm text-slate-400">
            {countryFlag(player.country)} {formatRank(player.rank)} · #
            {player.countryRank} in {player.country} ·{' '}
            {formatScore(Math.round(player.totalPp))} pp · {player.totalPlayed}{' '}
            maps played
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-48 flex-1">
          <label htmlFor={searchId} className="block text-sm text-slate-300">
            Filter songs
          </label>
          <input
            id={searchId}
            type="search"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              // A new search starts on its first page
              setPage(1);
            }}
            placeholder="Song or artist"
            className="border-night-line bg-night focus:border-neon-blue mt-1 w-full rounded border px-3 py-2 text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <div role="group" aria-label="Sort by" className="flex gap-2">
          {SORTS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              aria-pressed={sort === value}
              onClick={() => {
                setSort(value);
                setPage(1);
              }}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                sort === value
                  ? 'border-neon-blue bg-neon-blue text-white'
                  : 'border-night-line text-slate-300 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {scores.isError && <ErrorNote error={scores.error} />}
      {!loading && !scores.isError && items.length === 0 && (
        <EmptyState>
          {search === '' ? 'No scores yet.' : `No song matches “${search}”.`}
        </EmptyState>
      )}
      {loading && (
        <p role="status" className="sr-only">
          Loading scores
        </p>
      )}

      {(loading || items.length > 0) && !scores.isError && (
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
                  Score
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  Accuracy
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  Rank
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">
                  Played
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonRows columns={5} rows={items.length || 8} />}
              {!loading &&
                items.map(({ leaderboard, score }) => (
                  <tr
                    key={leaderboard.id}
                    className="border-night-line border-t"
                  >
                    <td className="w-full max-w-0 px-2 py-2">
                      <Song leaderboard={leaderboard} />
                    </td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">
                      {formatScore(score.modifiedScore)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatAccuracy(score.accuracy)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      #{score.rank}
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap text-slate-400">
                      {timeAgo(score.playedAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil((scores.data?.total ?? 0) / PAGE_SIZE)}
        onChange={setPage}
      />
    </div>
  );
};

export { ProfilePage };
