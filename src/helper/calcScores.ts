import type { Scores } from '@/../sharedTypes';

const calcTopScores = (scoresRecent: Scores): Scores =>
  [...scoresRecent].sort((a, b) => b.score - a.score);

const calcScoreHashed = (scoresRecent: Scores): string[] => {
  const scoredSongsHashes: string[] = [];

  scoresRecent.forEach((element) => scoredSongsHashes.push(element.songHash));

  return scoredSongsHashes;
};

export { calcScoreHashed, calcTopScores };
