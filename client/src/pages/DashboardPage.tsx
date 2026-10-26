import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { isSyncing, useHive, useNews } from '@/api/queries.ts';
import { Song } from '@/components/Song.tsx';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorNote,
  NeonHeading,
  Spinner,
  TimeAgo,
} from '@/components/ui.tsx';
import { formatDelta, formatScore } from '@/lib/format.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

import type { HiveMember, NewsItem } from '@/api/queries.ts';

/** "A bee went past your score", one card per event */
const NewsCard = ({ item }: { item: NewsItem }) => {
  const { t } = useTranslation();

  return (
    <Card className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <Avatar src={item.player.avatarUrl} size={28} />
        <Trans
          i18nKey="dashboard.beatYourScore"
          values={{ name: item.player.name }}
          components={{
            player: (
              <Link
                to={`/hive/${item.player.id}`}
                className="text-neon-yellow-core font-semibold hover:underline"
              />
            ),
          }}
        />
        <TimeAgo date={item.event.playedAt} className="text-slate-400" />
      </p>
      <Song leaderboard={item.leaderboard} />
      <p className="text-sm">
        <span className="text-slate-400">{t('dashboard.theirs')} </span>
        <span className="font-semibold text-slate-100">
          {formatScore(item.theirScore)}
        </span>
        <span className="text-slate-400"> · {t('dashboard.yours')} </span>
        <span className="font-semibold text-slate-100">
          {formatScore(item.myScore)}
        </span>
        <span className="text-neon-red-core ml-2 font-semibold">
          {formatDelta(item.myScore - item.theirScore)}
        </span>
      </p>
    </Card>
  );
};

/** One bee with the head-to-head record as a bar: my wins against theirs */
const RecordCard = ({ member }: { member: HiveMember }) => {
  const { t } = useTranslation();
  const { losing, player, shared, winning } = member;
  const decided = winning + losing;
  const share = decided === 0 ? 50 : Math.round((winning / decided) * 100);

  return (
    // The whole card can be clicked, but the link is only the name. A link
    // around everything would be read out as one long run of all its text.
    <div className="border-night-line bg-night-raised hover:border-neon-blue relative rounded-lg border p-4 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-neon-yellow">
      <div className="flex items-center gap-3">
        <Avatar src={player.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-100">
            <Link
              to={`/hive/${player.id}`}
              // Stretches the link's clickable area over the card
              className="outline-none after:absolute after:inset-0"
            >
              {player.name}
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            {isSyncing(player)
              ? t('dashboard.fetching')
              : t('dashboard.sharedMaps', { count: shared })}
          </p>
        </div>
      </div>

      <div
        className="bg-neon-red/70 mt-3 h-2 overflow-hidden rounded-full"
        // A picture of the two numbers below it, which say the same
        aria-hidden="true"
      >
        <div className="bg-neon-blue h-full" style={{ width: `${share}%` }} />
      </div>
      <p className="mt-1 flex justify-between text-xs">
        <span className="text-neon-blue-core">
          {t('dashboard.youLead', { number: winning })}
        </span>
        <span className="text-neon-red-core">
          {t('dashboard.theyLead', { number: losing })}
        </span>
      </p>
    </div>
  );
};

/** The start page after signing in: what happened, and how you stand */
const DashboardPage = () => {
  const { t } = useTranslation();
  const news = useNews();
  const hive = useHive();

  usePageTitle(t('dashboard.title'));

  return (
    <div className="space-y-10">
      {/* The page has two parts of equal weight. Its own title is only
          needed by those who navigate by headings. */}
      <h1 className="sr-only">{t('dashboard.title')}</h1>

      <section className="space-y-4">
        <NeonHeading as="h2" color="red" className="text-3xl">
          {t('dashboard.news')}
        </NeonHeading>
        {news.isPending && <Spinner />}
        {news.isError && (
          <ErrorNote error={news.error} onRetry={() => void news.refetch()} />
        )}
        {news.data?.items.length === 0 && (
          <EmptyState>{t('dashboard.noNews')}</EmptyState>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {news.data?.items.map((item) => (
            <NewsCard key={item.event.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <NeonHeading as="h2" color="blue" className="text-3xl">
          {t('dashboard.headToHead')}
        </NeonHeading>
        {hive.isPending && <Spinner />}
        {hive.isError && (
          <ErrorNote error={hive.error} onRetry={() => void hive.refetch()} />
        )}
        {hive.data?.items.length === 0 && (
          <EmptyState>
            <Trans
              i18nKey="dashboard.emptyHive"
              components={{
                hive: (
                  <Link
                    to="/hive"
                    className="text-neon-yellow-core underline"
                  />
                ),
              }}
            />
          </EmptyState>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hive.data?.items.map((member) => (
            <RecordCard key={member.player.id} member={member} />
          ))}
        </div>
      </section>
    </div>
  );
};

export { DashboardPage };
