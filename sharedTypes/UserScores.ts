type Difficulty = 1 | 3 | 5 | 7 | 9;

type DifficultyName = 'Easy' | 'Expert' | 'Expert+' | 'Hard' | 'Normal';

type PlayedBy = {
  beeScore: number;
  difficulty: Difficulty;
  myScore: number;
  playerId: string;
  playerName: string;
};

type Score = {
  difficulty: Difficulty;
  difficultyRaw: string;
  leaderboardId: number;
  levelAuthorName: string;
  maxScore: number;
  mods: string;
  playedBy?: PlayedBy[];
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

export type {
  Difficulty,
  DifficultyName,
  PlayedBy,
  Score,
  ScoreData,
  Scores,
  UserScores,
};
