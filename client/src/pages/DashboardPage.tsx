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
} from '@/components/ui.tsx';
import { formatDelta, formatScore, timeAgo } from '@/lib/format.ts';

import type { HiveMember, NewsItem } from '@/api/queries.ts';

/** "A bee went past your score", one card per event */
const NewsCard = ({ item }: { item: NewsItem }) => (
  <Card className="space-y-3">
    <p className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
      <Avatar src={item.player.avatarUrl} name={item.player.name} size={28} />
      <Link
        to={`/hive/${item.player.id}`}
        className="text-neon-yellow-core font-semibold hover:underline"
      >
        {item.player.name}
      </Link>
      beat your score
      <span className="text-slate-500">{timeAgo(item.event.playedAt)}</span>
    </p>
    <Song leaderboard={item.leaderboard} />
    <p className="text-sm">
      <span className="text-slate-400">Theirs </span>
      <span className="font-semibold text-slate-100">
        {formatScore(item.event.newScore)}
      </span>
      <span className="text-slate-400"> · yours </span>
      <span className="font-semibold text-slate-100">
        {formatScore(item.myScore)}
      </span>
      <span className="text-neon-red-core ml-2 font-semibold">
        {formatDelta(item.myScore - item.event.newScore)}
      </span>
    </p>
  </Card>
);

/** One bee with the head-to-head record as a bar: my wins against theirs */
const RecordCard = ({ member }: { member: HiveMember }) => {
  const { losing, player, shared, winning } = member;
  const decided = winning + losing;
  const share = decided === 0 ? 50 : Math.round((winning / decided) * 100);

  return (
    <Link
      to={`/hive/${player.id}`}
      className="border-night-line bg-night-raised hover:border-neon-blue block rounded-lg border p-4 transition"
    >
      <div className="flex items-center gap-3">
        <Avatar src={player.avatarUrl} name={player.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-100">{player.name}</p>
          <p className="text-xs text-slate-400">
            {isSyncing(player)
              ? 'Fetching scores…'
              : `${shared} shared ${shared === 1 ? 'map' : 'maps'}`}
          </p>
        </div>
      </div>

      <div
        className="bg-neon-red/70 mt-3 h-2 overflow-hidden rounded-full"
        role="img"
        aria-label={`You lead on ${winning}, ${player.name} leads on ${losing}`}
      >
        <div className="bg-neon-blue h-full" style={{ width: `${share}%` }} />
      </div>
      <p className="mt-1 flex justify-between text-xs">
        <span className="text-neon-blue-core">You lead on {winning}</span>
        <span className="text-neon-red-core">They lead on {losing}</span>
      </p>
    </Link>
  );
};

/** The start page after signing in: what happened, and how you stand */
const DashboardPage = () => {
  const news = useNews();
  const hive = useHive();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <NeonHeading color="red" className="text-3xl">
          News
        </NeonHeading>
        {news.isPending && <Spinner />}
        {news.isError && <ErrorNote error={news.error} />}
        {news.data?.items.length === 0 && (
          <EmptyState>
            Nobody has beaten one of your scores lately. Enjoy it while it
            lasts.
          </EmptyState>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {news.data?.items.map((item) => (
            <NewsCard key={item.event.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <NeonHeading as="h2" color="blue" className="text-3xl">
          Head to head
        </NeonHeading>
        {hive.isPending && <Spinner />}
        {hive.isError && <ErrorNote error={hive.error} />}
        {hive.data?.items.length === 0 && (
          <EmptyState>
            Your hive is empty.{' '}
            <Link to="/hive" className="text-neon-yellow-core underline">
              Add a bee
            </Link>{' '}
            to compare scores.
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
