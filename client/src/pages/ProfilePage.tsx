import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  isSyncing,
  PAGE_SIZE,
  useLinkProfile,
  useScores,
} from '@/api/queries.ts';
import { useDeleteAccount } from '@/auth/useDeleteAccount.ts';
import { LanguageSwitch } from '@/components/LanguageSwitch.tsx';
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

const SORTS = [
  { value: 'recent', label: 'scores.sort.recent' },
  { value: 'top', label: 'scores.sort.top' },
] as const satisfies { label: string; value: ScoreSort }[];

/** A player's scores as a table that can be searched, sorted and paged */
const ScoreList = ({
  playerId,
  syncing,
}: {
  playerId: string;
  /** True while the server fetches this player's scores from ScoreSaber */
  syncing: boolean;
}) => {
  const { t } = useTranslation();
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
  const items = scores.data?.items ?? [];
  // While the server fetches the scores from ScoreSaber, a list without
  // rows is not empty: it has not arrived. It is asked for again when the
  // fetch is done, and until that answer is in, the old one still stands.
  const awaitingScores =
    search === '' &&
    items.length === 0 &&
    !scores.isError &&
    (syncing || scores.isFetching);
  // True for the first load and for every new search, sort order or page.
  // A list that failed is not loading: what there is stays on screen, with
  // the error above it.
  const loading = scores.isPending || awaitingScores;
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
            {t('scores.filterLabel')}
          </label>
          <input
            id={searchId}
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('scores.filterPlaceholder')}
            className="border-night-control bg-night focus:border-neon-blue mt-1 w-full rounded border px-3 py-2 text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <div
          role="group"
          aria-label={t('scores.sort.label')}
          className="flex gap-2"
        >
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
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {scores.isError && (
        <ErrorNote error={scores.error} onRetry={() => void scores.refetch()} />
      )}
      {!loading && !scores.isError && items.length === 0 && (
        <EmptyState>
          {search === '' ? t('scores.empty') : t('scores.noMatch', { search })}
        </EmptyState>
      )}
      {/* Always there, so that a change of its text is read out: first
          that the list is loading, then what has arrived */}
      <p role="status" className="sr-only">
        {loading
          ? t('scores.loading')
          : total === undefined
            ? ''
            : lastPage > 1
              ? t('scores.listedPaged', {
                  count: total,
                  number: formatScore(total),
                  page,
                  total: lastPage,
                })
              : t('scores.listed', {
                  count: total,
                  number: formatScore(total),
                })}
      </p>

      {(loading || items.length > 0) && (
        // On a narrow screen the table scrolls sideways. A scrolling area
        // has to be reachable with the keyboard, or its right half is not.
        <div
          role="region"
          aria-label={t('scores.tableName')}
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
            <caption className="sr-only">{t('scores.tableName')}</caption>
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
                  {t('scores.columns.map')}
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  {t('scores.columns.score')}
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  {t('scores.columns.accuracy')}
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  {t('scores.columns.rank')}
                </th>
                <th
                  role="columnheader"
                  scope="col"
                  className="px-2 py-2 text-right font-semibold"
                >
                  {t('scores.columns.played')}
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
                      <CellLabel>{t('scores.columns.score')}</CellLabel>
                      {formatScore(score.modifiedScore)}
                    </td>
                    <td
                      role="cell"
                      className="px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>{t('scores.columns.accuracy')}</CellLabel>
                      {formatAccuracy(score.accuracy)}
                    </td>
                    <td
                      role="cell"
                      className="px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>{t('scores.columns.rank')}</CellLabel>#
                      {formatScore(score.rank)}
                    </td>
                    <td
                      role="cell"
                      className="px-2 py-2 text-right whitespace-nowrap text-slate-400 max-sm:flex-1 max-sm:pt-0 max-sm:text-left"
                    >
                      <CellLabel>{t('scores.columns.played')}</CellLabel>
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

/**
 * Deleting the account, behind a second step: the first button only opens
 * the question, the button that deletes appears with it.
 */
const DeleteAccount = () => {
  const { t } = useTranslation();
  const remove = useDeleteAccount();
  const [asking, setAsking] = useState(false);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-48 flex-1">
          <h2 className="font-semibold text-slate-100">
            {t('deleteAccount.heading')}
          </h2>
          <p className="text-sm text-slate-400">{t('deleteAccount.text')}</p>
        </div>
        <Button
          look="ghost"
          aria-expanded={asking}
          disabled={remove.isPending}
          onClick={() => setAsking(!asking)}
        >
          {asking ? t('deleteAccount.keep') : t('deleteAccount.open')}
        </Button>
      </div>

      {asking && (
        <div className="border-night-line flex flex-wrap items-center gap-4 border-t pt-3">
          <p className="min-w-48 flex-1 text-sm text-slate-300">
            {t('deleteAccount.question')}
          </p>
          <Button
            look="danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {t('deleteAccount.confirm')}
          </Button>
        </div>
      )}
      {remove.isError && <ErrorNote error={remove.error} />}
    </Card>
  );
};

/** My ScoreSaber profile and my scores */
const ProfilePage = ({ player }: { player: Player }) => {
  const { t } = useTranslation();
  const link = useLinkProfile();
  const [changing, setChanging] = useState(false);
  const changeButton = useRef<HTMLButtonElement>(null);
  // What just happened, for people who do not see the page change
  const [notice, setNotice] = useState('');

  usePageTitle(t('profile.title'));

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar src={player.avatarUrl} size={72} />
        <div>
          <NeonHeading color="blue" className="text-3xl">
            {player.name}
          </NeonHeading>
          <p className="text-sm text-slate-400">
            {countryFlag(player.country)}{' '}
            {[
              formatRank(player.rank),
              t('profile.countryRank', {
                rank: formatScore(player.countryRank),
                country: player.country,
              }),
              `${formatScore(Math.round(player.totalPp))} pp`,
              t('common.mapsPlayed', {
                count: player.totalPlayed,
                number: formatScore(player.totalPlayed),
              }),
            ].join(' · ')}
          </p>
        </div>
        <Button
          look="ghost"
          className="ml-auto"
          ref={changeButton}
          aria-expanded={changing}
          onClick={() => setChanging(!changing)}
        >
          {changing ? t('profile.keep') : t('profile.change')}
        </Button>
      </Card>
      <p role="status" className="sr-only">
        {notice}
      </p>

      {changing && (
        <Card className="space-y-3">
          <p className="text-sm text-slate-300">{t('profile.changeIntro')}</p>
          <PlayerSearch
            label={t('pickProfile.searchLabel')}
            actionLabel={t('pickProfile.action')}
            actionName={(found) =>
              t('pickProfile.actionFor', { name: found.name })
            }
            pendingId={link.isPending ? link.variables : undefined}
            onPick={(found) =>
              link.mutate(found.id, {
                onSuccess: () => {
                  setChanging(false);
                  setNotice(t('profile.changed', { name: found.name }));
                  // The picker closes, and the focus with it
                  changeButton.current?.focus();
                },
              })
            }
            disabledReason={(found) =>
              found.id === player.id ? t('profile.current') : undefined
            }
          />
          {link.isError && <ErrorNote error={link.error} />}
        </Card>
      )}

      {/* The key ties the list to the player. With another player it is a
          new list: React throws away the search text, the sort order and the
          page of the old one, instead of applying them to scores they were
          never meant for. */}
      <ScoreList
        key={player.id}
        playerId={player.id}
        syncing={isSyncing(player)}
      />

      <Card className="flex flex-wrap items-center gap-4">
        <h2 className="min-w-48 flex-1 font-semibold text-slate-100">
          {t('language.heading')}
        </h2>
        <LanguageSwitch />
      </Card>

      <DeleteAccount />
    </div>
  );
};

export { ProfilePage };
