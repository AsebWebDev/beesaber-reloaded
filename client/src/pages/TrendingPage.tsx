import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { PAGE_SIZE, useTrending } from '@/api/queries.ts';
import { Pagination } from '@/components/Pagination.tsx';
import { SkeletonRows } from '@/components/SkeletonRows.tsx';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  CellLabel,
  EmptyState,
  ErrorNote,
  NeonHeading,
  TimeAgo,
} from '@/components/ui.tsx';
import { formatScore } from '@/lib/format.ts';
import { lastPageOf, pageFrom, useLastKnown } from '@/lib/pagination.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

import type { TrendingItem } from '@/api/queries.ts';

/** The classes that fold a value cell under the map on a phone */
const valueCell = 'px-2 py-2 max-sm:flex-1 max-sm:pt-0';

/**
 * Maps my bees played lately that I have never played: something new to
 * try, and somebody to compare with right away. The page lives in the
 * address (`?page=2`), like the other lists.
 */
const TrendingPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageFrom(searchParams.get('page'));

  const trending = useTrending({ page });
  const items = trending.data?.items ?? [];
  const total = trending.data?.total;
  // Known before the first answer only as what the server will say
  const days = useLastKnown(trending.data?.days);
  const lastPage = lastPageOf(useLastKnown(total) ?? 0, PAGE_SIZE);
  const rowsBefore = useLastKnown(trending.data?.items.length);
  // A link to page 9 of a list that has three: go to the last one there is
  const beyondTheEnd = total !== undefined && page > lastPage;
  const loading = trending.isPending || beyondTheEnd;

  usePageTitle(t('trending.title'));

  useEffect(() => {
    if (beyondTheEnd)
      setSearchParams({ page: String(lastPage) }, { replace: true });
  }, [beyondTheEnd, lastPage, setSearchParams]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <NeonHeading color="yellow" className="text-3xl">
          {t('trending.title')}
        </NeonHeading>
        {days !== undefined && (
          <p className="text-sm text-slate-400">
            {t('trending.intro', { days })}
          </p>
        )}
      </div>

      {trending.isError && (
        <ErrorNote
          error={trending.error}
          onRetry={() => void trending.refetch()}
        />
      )}
      {/* Always there, so that a change of its text is read out: first
          that the list is loading, then what has arrived */}
      <p role="status" className="sr-only">
        {loading
          ? t('trending.loading')
          : total === undefined
            ? ''
            : lastPage > 1
              ? t('trending.listedPaged', {
                  count: total,
                  number: formatScore(total),
                  page,
                  total: lastPage,
                })
              : t('trending.listed', {
                  count: total,
                  number: formatScore(total),
                })}
      </p>
      {!loading && !trending.isError && trending.data?.items.length === 0 && (
        <EmptyState>
          {t('trending.empty', { days: trending.data.days })}
        </EmptyState>
      )}

      {(loading || items.length > 0) && (
        // On a narrow screen the table scrolls sideways. A scrolling area
        // has to be reachable with the keyboard, or its right half is not.
        <div
          role="region"
          aria-label={t('trending.title')}
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
            <caption className="sr-only">{t('trending.title')}</caption>
            <thead
              role="rowgroup"
              className="text-neon-yellow-core text-xs tracking-wider uppercase max-sm:sr-only"
            >
              <tr role="row">
                {(['map', 'bees', 'played', 'scoreSaber'] as const).map(
                  (column) => (
                    <th
                      key={column}
                      role="columnheader"
                      scope="col"
                      className="px-2 py-2 font-semibold"
                    >
                      {t(`trending.columns.${column}`)}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody role="rowgroup" className="max-sm:block">
              {loading && <SkeletonRows columns={4} rows={rowsBefore || 8} />}
              {!loading &&
                items.map((item) => (
                  <Row key={item.leaderboard.id} item={item} />
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={lastPage}
        onChange={(next) => setSearchParams({ page: String(next) })}
      />
    </div>
  );
};

/** The bees who played a map, the one who played it last first */
const Bees = ({ bees }: Pick<TrendingItem, 'bees'>) => (
  <ul className="flex flex-wrap gap-x-3 gap-y-1">
    {bees.map((bee) => (
      <li key={bee.id} className="inline-flex items-center gap-2">
        <Avatar src={bee.avatarUrl} size={24} />
        <Link to={`/hive/${bee.id}`} className="hover:underline">
          {bee.name}
        </Link>
      </li>
    ))}
  </ul>
);

const Row = ({ item }: { item: TrendingItem }) => {
  const { t } = useTranslation();
  const { bees, lastPlayedAt, leaderboard } = item;

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
      <td role="cell" className={valueCell}>
        <CellLabel>{t('trending.columns.bees')}</CellLabel>
        <Bees bees={bees} />
      </td>
      <td role="cell" className={`${valueCell} whitespace-nowrap`}>
        <CellLabel>{t('trending.columns.played')}</CellLabel>
        <TimeAgo date={lastPlayedAt} className="text-slate-300" />
      </td>
      <td role="cell" className={`${valueCell} whitespace-nowrap`}>
        <CellLabel>{t('trending.columns.scoreSaber')}</CellLabel>
        <a
          href={`https://scoresaber.com/leaderboard/${leaderboard.id}`}
          // Every row has such a link; the name says which map it is for
          aria-label={t('trending.onScoreSaberFor', {
            song: leaderboard.songName,
          })}
          className="text-neon-yellow-core underline"
        >
          {t('trending.onScoreSaber')}
        </a>
      </td>
    </tr>
  );
};

export { Bees, TrendingPage };
