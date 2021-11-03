import type Settings from './Settings';

export type UserData = {
  __v: number;
  _id: string;
  bees: unknown[];
  created_at: string;
  googleId: string;
  isAdmin: boolean;
  myIntersections: unknown[];
  myScoreSaberId: string;
  news: unknown[];
  profilePic?: string;
  scoreData: {
    scoredSongsHashes: unknown[];
    scoresRecent: unknown[];
    scoresTop: unknown[];
  };
  settings: Settings;
  updated_at: string;
  username?: string;
};
