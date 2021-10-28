import type Settings from './Settings';

type BasicUserData = {
  __v: number;
  _id: string;
  bees: unknown[];
  created_at: string;
  googleId: string;
  isAdmin: boolean;
  myIntersections: unknown[];
  myScoreSaberId: number | null;
  news: unknown[];
  scoreData: {
    scoredSongsHashes: unknown[];
    scoresRecent: unknown[];
    scoresTop: unknown[];
  };
  settings: Settings;
  updated_at: string;
};

export type { BasicUserData };

export type UserData = BasicUserData | Record<string, unknown>;
