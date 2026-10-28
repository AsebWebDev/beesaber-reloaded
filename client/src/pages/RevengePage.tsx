import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { PAGE_SIZE, useHive, useRevenge } from '@/api/queries.ts';
import { Gap } from '@/components/Gap.tsx';
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
import { formatScore } from '@/lib/format.ts';
import { lastPageOf, pageFrom, useLastKnown } from '@/lib/pagination.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

import type { RevengeItem } from '@/api/queries.ts';

/** The classes that fold a value cell under the map on a phone */
const valueCell =
  'px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left';

/** A filter button, pressed or not, like the filters of the comparison */
const pill = (pressed: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
    pressed
      ? 'border-neon-blue bg-neon-blue text-white'
      : 'border-night-control text-slate-300 hover:border-slate-300'
  }`;

/**
 * Maps where a bee is ahead of me, the closest first: the list of what is
 * worth playing again. Which bee and which page live in the address
 * (`?bee=7656…&page=2`), like the comparison's filter.
 */
const RevengePage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const bee = searchParams.get('bee') ?? undefined;
  const page = pageFrom(searchParams.get('page'));

  const hive = useHive();
  const revenge = useRevenge({ bee, page });
  const items = revenge.data?.items ?? [];
  const total = revenge.data?.total;
  const lastPage = lastPageOf(useLastKnown(total) ?? 0, PAGE_SIZE);
  const rowsBefore = useLastKnown(revenge.data?.items.length);
  // A link to page 9 of a list that has three: go to the last one there is
  const beyondTheEnd = total !== undefined && page > lastPage;
  const loading = revenge.isPending || beyondTheEnd;
  const beeName = hive.data?.items.find(({ player }) => player.id === bee)
    ?.player.name;

  usePageTitle(t('revenge.title'));

  useEffect(() => {
    if (beyondTheEnd)
      setSearchParams(
        { ...(bee === undefined ? {} : { bee }), page: String(lastPage) },
        { replace: true }
      );
  }, [beyondTheEnd, bee, lastPage, setSearchParams]);

  const show = (next: { bee?: string | null; page?: number }) => {
    const nextBee = next.bee === undefined ? bee : (next.bee ?? undefined);

    setSearchParams({
      ...(nextBee === undefined ? {} : { bee: nextBee }),
      // Another bee starts on its first page
      page: String(next.bee === undefined ? (next.page ?? page) : 1),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <NeonHeading color="red" className="text-3xl">
          {t('revenge.title')}
        </NeonHeading>
        <p className="text-sm text-slate-400">{t('revenge.intro')}</p>
      </div>

      {(hive.data?.items.length ?? 0) > 1 && (
        <div
          role="group"
          aria-label={t('revenge.filter.label')}
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={bee === undefined}
            onClick={() => show({ bee: null })}
            className={pill(bee === undefined)}
          >
            {t('revenge.filter.all')}
          </button>
          {hive.data?.items.map(({ player }) => (
            <button
              key={player.id}
              type="button"
              aria-pressed={bee === player.id}
              onClick={() => show({ bee: player.id })}
              className={pill(bee === player.id)}
            >
              {player.name}
            </button>
          ))}
        </div>
      )}

      {revenge.isError && (
        <ErrorNote
          error={revenge.error}
          onRetry={() => void revenge.refetch()}
        />
      )}
      {/* Always there, so that a change of its text is read out: first
          that the list is loading, then what has arrived */}
      <p role="status" className="sr-only">
        {loading
          ? t('revenge.loading')
          : total === undefined
            ? ''
            : lastPage > 1
              ? t('revenge.listedPaged', {
                  count: total,
                  number: formatScore(total),
                  page,
                  total: lastPage,
                })
              : t('revenge.listed', {
                  count: total,
                  number: formatScore(total),
                })}
      </p>
      {!loading && !revenge.isError && items.length === 0 && (
        <EmptyState>
          {beeName === undefined
            ? t('revenge.empty')
            : t('revenge.emptyBee', { name: beeName })}
        </EmptyState>
      )}

      {(loading || items.length > 0) && (
        // On a narrow screen the table scrolls sideways. A scrolling area
        // has to be reachable with the keyboard, or its right half is not.
        <div
          role="region"
          aria-label={t('revenge.title')}
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table
            role="table"
            aria-busy={loading}
            // On a phone every row folds into two lines, like the other
            // tables: the map, and below it the values
            className="w-full text-left text-sm max-sm:block sm:min-w-[44rem]"
          >
            <caption className="sr-only">{t('revenge.title')}</caption>
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
                  {t('revenge.columns.map')}
                </th>
                {(['bee', 'mine', 'theirs', 'need'] as const).map((column) => (
                  <th
                    key={column}
                    role="columnheader"
                    scope="col"
                    className={`px-2 py-2 font-semibold ${
                      column === 'bee' ? '' : 'text-right'
                    }`}
                  >
                    {t(`revenge.columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup" className="max-sm:block">
              {loading && <SkeletonRows columns={5} rows={rowsBefore || 8} />}
              {!loading &&
                items.map((item) => <Row key={rowKey(item)} item={item} />)}
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

/** One map can be in the list once for every bee ahead on it */
const rowKey = ({ bee, leaderboard }: RevengeItem) =>
  `${leaderboard.id}-${bee.id}`;

const Row = ({ item }: { item: RevengeItem }) => {
  const { t } = useTranslation();
  const { bee, gap, gapShare, leaderboard, myScore, theirScore } = item;

  return (
    <tr
      role="row"
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
        className="px-2 py-2 whitespace-nowrap max-sm:flex-1 max-sm:pt-0"
      >
        <CellLabel>{t('revenge.columns.bee')}</CellLabel>
        <span className="inline-flex items-center gap-2">
          <Avatar src={bee.avatarUrl} size={24} />
          <Link to={`/hive/${bee.id}`} className="hover:underline">
            {bee.name}
          </Link>
        </span>
      </td>
      <td role="cell" className={valueCell}>
        <CellLabel>{t('revenge.columns.mine')}</CellLabel>
        {formatScore(myScore)}
      </td>
      <td role="cell" className={valueCell}>
        <CellLabel>{t('revenge.columns.theirs')}</CellLabel>
        {formatScore(theirScore)}
      </td>
      <td
        role="cell"
        className={`${valueCell} text-neon-red-core font-semibold`}
      >
        <CellLabel>{t('revenge.columns.need')}</CellLabel>
        <Gap gap={gap} gapShare={gapShare} />
      </td>
    </tr>
  );
};

export { RevengePage };
