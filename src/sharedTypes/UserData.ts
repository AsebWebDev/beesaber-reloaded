import type { PlayerInfo, ScoreStats } from './ScoreSaberUserInfo';
import type Settings from './Settings';
import type { ScoreData, UserScores } from './UserScores';

export type UserData = {
  __v: number;
  _id: string;
  bees: unknown[];
  created_at: string;
  googleId: string;
  googleImageUrl: string;
  googleName: string;
  isAdmin: boolean;
  myIntersections: unknown[];
  myScoreSaberId?: string;
  news: unknown[];
  playerInfo?: PlayerInfo;
  profilePic?: string;
  rank?: number;
  scoreData?: ScoreData;
  scoreStats?: ScoreStats;
  settings: Settings;
  updated_at: string;
  userScores?: UserScores;
  username?: string;
};
