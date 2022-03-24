import type { ScoreData } from './UserScores';

export type Bee = {
  avatar: string;
  country: string;
  playCount?: number;
  playerId: string;
  playerName: string;
  rank: number;
  scoreData: ScoreData;
};
