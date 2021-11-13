type Badge = {
  description: string;
  image: string;
};

type PlayerInfo = {
  avatar: string;
  badges: Badge[];
  banned: number;
  country: string; // could potentially be a union type of country codes
  countryRank: number;
  history: string;
  inactive: number;
  permissions: number;
  playerId: string;
  playerName: string;
  pp: number;
  rank: number;
  role: string;
};

type ScoreStats = {
  averageRankedAccuracy: number;
  rankedPlayCount: number;
  totalPlayCount: number;
  totalRankedScore: number;
  totalScore: number;
};

type ScoreSaberUserInfo = {
  playerInfo: PlayerInfo;
  scoreStats: ScoreStats;
};

export type { PlayerInfo, ScoreStats };

export default ScoreSaberUserInfo;
