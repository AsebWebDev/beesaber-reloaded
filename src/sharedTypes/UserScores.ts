type Score = {
  difficulty: number;
  difficultyRaw: string;
  leaderboardId: number;
  levelAuthorName: string;
  maxScore: number;
  mods: string;
  playedByHive?: boolean;
  pp: number;
  rank: number;
  score: number;
  scoreId: number;
  songAuthorName: string;
  songHash: string;
  songName: string;
  songSubName: string;
  timeSet: string;
  unmodififiedScore: number;
  weight: number;
};

type Scores = Score[];

type ScoreData = {
  scoredSongsHashes: string[];
  scoresRecent: Score[];
  scoresTop: Score[];
};

type UserScores = {
  scores: Scores;
};

export type { Score, ScoreData, Scores, UserScores };
