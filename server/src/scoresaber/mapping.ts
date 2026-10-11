import type { leaderboards, players, scores } from '../db/schema.ts';
import type { ScoreSaberPlayer, ScoreSaberPlayerScore } from './client.ts';

/**
 * Translates ScoreSaber's answers into rows of our tables. This is the only
 * place that knows both shapes, so a renamed field on either side is a
 * change in this file and nowhere else.
 */

type PlayerRow = Omit<typeof players.$inferInsert, 'scoresSyncedAt'>;
type LeaderboardRow = typeof leaderboards.$inferInsert;
type ScoreRow = typeof scores.$inferInsert;

const toPlayerRow = (player: ScoreSaberPlayer, syncedAt: Date): PlayerRow => ({
  id: player.id,
  name: player.name,
  country: player.country,
  avatarUrl: player.avatar,
  rank: player.stats.rank,
  countryRank: player.stats.countryRank,
  totalPp: player.stats.totalPP,
  totalPlayed: player.stats.totalPlayedLeaderboards,
  inactive: player.inactive,
  profileSyncedAt: syncedAt,
});

const toLeaderboardRow = ({
  leaderboard,
}: ScoreSaberPlayerScore): LeaderboardRow => ({
  id: leaderboard.id,
  mapHash: leaderboard.map.hash,
  songName: leaderboard.map.songName,
  songSubName: leaderboard.map.songSubName,
  songAuthorName: leaderboard.map.songAuthorName,
  levelAuthorName: leaderboard.map.levelAuthorName,
  coverUrl: leaderboard.map.coverUrl,
  difficulty: leaderboard.difficulty.difficulty,
  gameMode: leaderboard.difficulty.gameMode,
  maxScore: leaderboard.maxScore,
  stars: leaderboard.realm.stars,
  status: leaderboard.realm.leaderboardStatus,
});

const toScoreRow = (
  playerId: string,
  { leaderboard, score }: ScoreSaberPlayerScore
): ScoreRow => ({
  playerId,
  leaderboardId: leaderboard.id,
  scoreSaberId: score.id,
  modifiedScore: score.modifiedScore,
  unmodifiedScore: score.unmodifiedScore,
  accuracy: score.accuracy,
  pp: score.pp,
  rank: score.rank,
  mods: score.mods,
  fullCombo: score.fullCombo,
  missedNotes: score.missedNotes,
  badCuts: score.badCuts,
  maxCombo: score.maxCombo,
  playedAt: new Date(score.createdAt),
});

export { toLeaderboardRow, toPlayerRow, toScoreRow };
export type { LeaderboardRow, PlayerRow, ScoreRow };
