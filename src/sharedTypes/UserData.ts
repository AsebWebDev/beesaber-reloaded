import type { PlayerInfo, ScoreStats } from './ScoreSaberUserInfo';
import type Settings from './Settings';
import type { ScoreData, UserScores } from './UserScores';

export type Bee = {
  playerName: string;
  scoreData: ScoreData;
};

export type UserData = {
  __v: number;
  _id: string;
  bees: Bee[];
  created_at: string;
  googleId: string;
  googleImageUrl: string;
  googleName: string;
  isAdmin: boolean;
  myIntersections: unknown[];
  myScoreSaberId: string;
  news: unknown[];
  playerInfo?: PlayerInfo;
  profilePic?: string;
  rank?: number;
  scoreData?: ScoreData;
  scoreStats?: ScoreStats;
  settings: Settings;
  totalPlayCount?: number;
  updated_at: string;
  userScores?: UserScores;
  username?: string;
};

export type GoogleUserData = Pick<
  UserData,
  | '_id'
  | 'googleImageUrl'
  | 'googleName'
  | 'myScoreSaberId'
  | 'profilePic'
  | 'username'
>;
