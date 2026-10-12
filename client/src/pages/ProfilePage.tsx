import { useId, useState } from 'react';

import { PAGE_SIZE, useLinkProfile, useScores } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { PlayerSearch } from '@/components/PlayerSearch.tsx';
import { SkeletonRows } from '@/components/SkeletonRows.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  Button,
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
import { lastPageOf, useLastKnown } from '@/lib/pagination.ts';
import { useDebouncedValue } from '@/lib/useDebouncedValue.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

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
  const link = useLinkProfile();
  const [changing, setChanging] = useState(false);
  // Loading for the first time, or showing the previous list while the one
  // for a new sort order, search or page is on its way. A list that failed
  // is not loading: what there is stays on screen, with the error above it.
  const loading =
    !scores.isError && (scores.isPending || scores.isPlaceholderData);
  const items = scores.data?.items ?? [];

  usePageTitle('My profile');
  const lastPage = lastPageOf(useLastKnown(scores.data?.total) ?? 0, PAGE_SIZE);

  // The list got shorter than the page we are on
  if (scores.data !== undefined && !scores.isPlaceholderData && page > lastPage)
    setPage(lastPage);

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
        <Button
          look="ghost"
          className="ml-auto"
          aria-expanded={changing}
          onClick={() => setChanging(!changing)}
        >
          {changing ? 'Keep this profile' : 'Change profile'}
        </Button>
      </Card>

      {changing && (
        <Card className="space-y-3">
          <p className="text-sm text-slate-300">
            Pick the ScoreSaber profile you want to compare as. Your hive stays
            as it is; the scores of the new profile are fetched.
          </p>
          <PlayerSearch
            label="Your name on ScoreSaber"
            actionLabel="This is me"
            pendingId={link.isPending ? link.variables : undefined}
            onPick={(found) =>
              link.mutate(found.id, {
                onSuccess: () => {
                  setChanging(false);
                  setPage(1);
                },
              })
            }
            disabledReason={(found) =>
              found.id === player.id ? 'Your current profile' : undefined
            }
          />
          {link.isError && <ErrorNote error={link.error} />}
        </Card>
      )}

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
            className="border-night-control bg-night focus:border-neon-blue mt-1 w-full rounded border px-3 py-2 text-slate-100 placeholder:text-slate-400"
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
                  : 'border-night-control text-slate-300 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {scores.isError && (
        <ErrorNote error={scores.error} onRetry={() => void scores.refetch()} />
      )}
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

      <Pagination page={page} totalPages={lastPage} onChange={setPage} />
    </div>
  );
};

export { ProfilePage };
