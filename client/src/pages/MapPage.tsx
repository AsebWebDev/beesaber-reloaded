import { Trans, useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { ApiError } from '@/api/client.ts';
import { useMapRanking } from '@/api/queries.ts';
import { DifficultyBadge } from '@/components/Song.tsx';
import {
  Avatar,
  CellLabel,
  EmptyState,
  ErrorNote,
  NeonHeading,
  Picture,
  Spinner,
  TimeAgo,
} from '@/components/ui.tsx';
import { formatAccuracy, formatDelta, formatScore } from '@/lib/format.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** The classes that fold a value cell under the player on a phone */
const valueCell =
  'px-2 py-2 text-right tabular-nums max-sm:flex-1 max-sm:pt-0 max-sm:text-left';

/**
 * One map: what it is, and how I and my bees stand on it, best first.
 * ScoreSaber shows a map's ranking among everyone who played it; this is
 * the ranking among friends, which ScoreSaber cannot show.
 */
const MapPage = () => {
  const { t } = useTranslation();
  const { leaderboardId = '' } = useParams();
  const ranking = useMapRanking(leaderboardId);
  const leaderboard = ranking.data?.leaderboard;
  const entries = ranking.data?.entries ?? [];
  const best = entries[0]?.score.modifiedScore;
  // A map BeeSaber has never seen, or an address that is no map id at all
  const unknown =
    ranking.error instanceof ApiError &&
    (ranking.error.code === 'unknown_map' ||
      ranking.error.code === 'validation_failed');

  usePageTitle(
    unknown ? t('map.unknown.title') : (leaderboard?.songName ?? t('map.title'))
  );

  if (unknown)
    return (
      <div className="space-y-6">
        <NeonHeading color="yellow" className="text-3xl">
          {t('map.unknown.title')}
        </NeonHeading>
        <EmptyState>
          <Trans
            i18nKey="map.unknown.text"
            components={{
              home: <Link to="/" className="text-neon-yellow-core underline" />,
            }}
          />
        </EmptyState>
      </div>
    );

  const tableName = t('map.tableName', {
    song: leaderboard?.songName ?? t('map.title'),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 sm:gap-4">
        {leaderboard !== undefined && (
          <Picture src={leaderboard.coverUrl} size={72} className="rounded" />
        )}
        <div className="min-w-0 space-y-1">
          <NeonHeading
            color="yellow"
            className="text-2xl break-words sm:text-3xl"
          >
            {leaderboard?.songName ?? '…'}
          </NeonHeading>
          {leaderboard !== undefined && (
            <>
              <p className="text-sm text-slate-400">
                {t('song.byline', {
                  author: leaderboard.songAuthorName,
                  mapper: leaderboard.levelAuthorName,
                })}
              </p>
              <p className="flex flex-wrap items-center gap-3 text-sm">
                <DifficultyBadge difficulty={leaderboard.difficulty} />
                <a
                  href={`https://scoresaber.com/leaderboard/${leaderboard.id}`}
                  className="text-neon-yellow-core underline"
                >
                  {t('map.onScoreSaber')}
                </a>
              </p>
            </>
          )}
        </div>
      </header>

      <NeonHeading as="h2" color="blue" className="text-2xl">
        {t('map.ranking')}
      </NeonHeading>

      {ranking.isPending && <Spinner />}
      {ranking.isError && (
        <ErrorNote
          error={ranking.error}
          onRetry={() => void ranking.refetch()}
        />
      )}
      {ranking.isSuccess && entries.length === 0 && (
        <EmptyState>{t('map.empty')}</EmptyState>
      )}

      {entries.length > 0 && (
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
            // On a phone every row folds into two lines, like the other
            // tables: the player, and below them the values
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
                  {t('map.columns.player')}
                </th>
                {(['score', 'accuracy', 'gap', 'played'] as const).map(
                  (column) => (
                    <th
                      key={column}
                      role="columnheader"
                      scope="col"
                      className="px-2 py-2 text-right font-semibold"
                    >
                      {t(`map.columns.${column}`)}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody role="rowgroup" className="max-sm:block">
              {entries.map(({ isMe, place, player, score }) => (
                <tr
                  role="row"
                  key={player.id}
                  // My own row stands out, in colour and, for those who do
                  // not see colour, with "(you)" after the name
                  className={`border-night-line border-t max-sm:flex max-sm:flex-wrap max-sm:pb-1 ${
                    isMe ? 'bg-neon-blue/15' : ''
                  }`}
                >
                  <td
                    role="cell"
                    className="w-full max-w-0 px-2 py-2 max-sm:max-w-none max-sm:basis-full"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-7 shrink-0 text-right font-semibold text-slate-300 tabular-nums">
                        {t('map.place', { place })}
                      </span>
                      <Avatar src={player.avatarUrl} size={28} />
                      <span className="truncate font-medium text-slate-100">
                        {isMe ? (
                          player.name
                        ) : (
                          <Link
                            to={`/hive/${player.id}`}
                            className="hover:underline"
                          >
                            {player.name}
                          </Link>
                        )}
                        {isMe && (
                          <span className="ml-1 font-normal text-slate-400">
                            ({t('map.you')})
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td role="cell" className={`${valueCell} font-semibold`}>
                    <CellLabel>{t('map.columns.score')}</CellLabel>
                    {formatScore(score.modifiedScore)}
                  </td>
                  <td role="cell" className={valueCell}>
                    <CellLabel>{t('map.columns.accuracy')}</CellLabel>
                    {formatAccuracy(score.accuracy)}
                  </td>
                  <td role="cell" className={valueCell}>
                    <CellLabel>{t('map.columns.gap')}</CellLabel>
                    {/* The first has no one to be behind */}
                    {place === 1 || best === undefined
                      ? '–'
                      : formatDelta(score.modifiedScore - best)}
                  </td>
                  <td
                    role="cell"
                    className={`${valueCell} whitespace-nowrap text-slate-400`}
                  >
                    <CellLabel>{t('map.columns.played')}</CellLabel>
                    <TimeAgo date={score.playedAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { MapPage };
