import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { difficultyName } from '@/lib/format.ts';

import { Picture } from './ui.tsx';

import type { Leaderboard } from '@/api/queries.ts';

const difficultyLook: Record<number, string> = {
  1: 'border-emerald-400 text-emerald-300',
  3: 'border-sky-400 text-sky-300',
  5: 'border-orange-400 text-orange-300',
  7: 'border-red-400 text-red-300',
  9: 'border-fuchsia-400 text-fuchsia-300',
};

const DifficultyBadge = ({ difficulty }: { difficulty: number }) => (
  <span
    className={`rounded border px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap ${difficultyLook[difficulty] ?? 'border-slate-400 text-slate-300'}`}
  >
    {difficultyName(difficulty)}
  </span>
);

/**
 * Cover, title and difficulty of a map, as one table cell's content. The
 * title leads to the map's page, with the ranking of the whole hive on it.
 */
const Song = ({ leaderboard }: { leaderboard: Leaderboard }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Picture src={leaderboard.coverUrl} size={44} className="rounded" />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-100">
          <Link to={`/maps/${leaderboard.id}`} className="hover:underline">
            {leaderboard.songName}
          </Link>
        </p>
        <p className="truncate text-xs text-slate-400">
          {t('song.byline', {
            author: leaderboard.songAuthorName,
            mapper: leaderboard.levelAuthorName,
          })}
        </p>
      </div>
      <DifficultyBadge difficulty={leaderboard.difficulty} />
    </div>
  );
};

export { DifficultyBadge, Song };
