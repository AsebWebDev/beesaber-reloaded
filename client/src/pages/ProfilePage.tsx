import { useId, useRef, useState } from 'react';

import { PAGE_SIZE, useLinkProfile, useScores } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { PlayerSearch } from '@/components/PlayerSearch.tsx';
import { SkeletonRows } from '@/components/SkeletonRows.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  Button,
  Card,
  CellLabel,
  EmptyState,
  ErrorNote,
  NeonHeading,
  TimeAgo,
} from '@/components/ui.tsx';
import {
  countryFlag,
  formatAccuracy,
  formatRank,
  formatScore,
} from '@/lib/format.ts';
import { lastPageOf, useLastKnown } from '@/lib/pagination.ts';
import { useDebouncedValue } from '@/lib/useDebouncedValue.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

import type { Player, ScoreSort } from '@/api/queries.ts';

const SORTS: { label: string; value: ScoreSort }[] = [
  { value: 'recent', label: 'Latest' },
  { value: 'top', label: 'Highest score' },
];

/** A player's scores as a table that can be searched, sorted and paged */
const ScoreList = ({ playerId }: { playerId: string }) => {
  const searchId = useId();
  const [sort, setSort] = useState<ScoreSort>('recent');
  const [text, setText] = useState('');
  const search = useDebouncedValue(text.trim());

  // A page number only means something within one list. It is stored with
  // the list it belongs to, so a new search or sort order starts on page 1
  // in the same moment it takes effect. Setting the page to 1 when a key is
  // pressed would come too early: the search waits for typing to pause, and
  // until then page 1 of the old list would be fetched for nothing.
  const list = `${sort}|${search}`;
  const [paging, setPaging] = useState({ list, page: 1 });
  const page = paging.list === list ? paging.page : 1;
  const setPage = (next: number) => setPaging({ list, page: next });

  const scores = useScores(playerId, { page, search, sort });
  // True for the first load and for every new search, sort order or page.
  // A list that failed is not loading: what there is stays on screen, with
  // the error above it.
  const loading = scores.isPending;
  const items = scores.data?.items ?? [];
  const total = scores.data?.total;
  // While a list loads or has failed it has no total and no rows. What was
  // there before keeps the page buttons and the height of the table.
  const lastPage = lastPageOf(useLastKnown(total) ?? 0, PAGE_SIZE);
  const rowsBefore = useLastKnown(scores.data?.items.length);

  // The list got shorter than the page we are on
  if (total !== undefined && page > lastPage) setPage(lastPage);

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-48 flex-1">
          <label htmlFor={searchId} className="block text-sm text-slate-300">
            Filter songs
          </label>
          <input
            id={searchId}
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
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
              onClick={() => setSort(value)}
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
      {/* Always there, so that a change of its text is read out: first
          that the list is loading, then what has arrived */}
      <p role="status" className="sr-only">
        {loading
          ? 'Loading scores'
          : total === undefined
            ? ''
            : `${total} ${total === 1 ? 'score' : 'scores'} in this list${
                lastPage > 1 ? `, page ${page} of ${lastPage}` : ''
              }.`}
      </p>

      {(loading || items.length > 0) && (
        // On a narrow screen the table scrolls sideways. A scrolling area
        // has to be reachable with the keyboard, or its right half is not.
        <div
          role="region"
          aria-label="My scores"
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
            <caption className="sr-only">My scores</caption>
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
                  Score
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  Accuracy
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  Rank
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  Played
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="max-sm:block">
              {loading && <SkeletonRows columns={5} rows={rowsBefore || 8} />}
              {!loading &&
                items.map(({ leaderboard, score }) => (
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
                      className="px-2 py-2 text-right font-semibold tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>Score</CellLabel>
                      {formatScore(score.modifiedScore)}
                    </td>
                    <td
                      role="cell"
                      className="px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>Accuracy</CellLabel>
                      {formatAccuracy(score.accuracy)}
                    </td>
                    <td
                      role="cell"
                      className="px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>Rank</CellLabel>#{score.rank}
                    </td>
                    <td
                      role="cell"
                      className="px-2 py-2 text-right whitespace-nowrap text-slate-400 max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>Played</CellLabel>
                      <TimeAgo date={score.playedAt} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={lastPage} onChange={setPage} />
    </>
  );
};

/** My ScoreSaber profile and my scores */
const ProfilePage = ({ player }: { player: Player }) => {
  const link = useLinkProfile();
  const [changing, setChanging] = useState(false);
  const changeButton = useRef<HTMLButtonElement>(null);
  // What just happened, for people who do not see the page change
  const [notice, setNotice] = useState('');

  usePageTitle('My profile');

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar src={player.avatarUrl} size={72} />
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
          ref={changeButton}
          aria-expanded={changing}
          onClick={() => setChanging(!changing)}
        >
          {changing ? 'Keep this profile' : 'Change profile'}
        </Button>
      </Card>
      <p role="status" className="sr-only">
        {notice}
      </p>

      {changing && (
        <Card className="space-y-3">
          <p className="text-sm text-slate-300">
            Pick the ScoreSaber profile you want to compare as. Your hive stays
            as it is; the scores of the new profile are fetched.
          </p>
          <PlayerSearch
            label="Your name on ScoreSaber"
            actionLabel="This is me"
            actionName={(found) => `This is me: ${found.name}`}
            pendingId={link.isPending ? link.variables : undefined}
            onPick={(found) =>
              link.mutate(found.id, {
                onSuccess: () => {
                  setChanging(false);
                  setNotice(`You now compare as ${found.name}.`);
                  // The picker closes, and the focus with it
                  changeButton.current?.focus();
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

      {/* The key ties the list to the player. With another player it is a
          new list: React throws away the search text, the sort order and the
          page of the old one, instead of applying them to scores they were
          never meant for. */}
      <ScoreList key={player.id} playerId={player.id} />
    </div>
  );
};

export { ProfilePage };
