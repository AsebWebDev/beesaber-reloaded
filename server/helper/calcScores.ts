import type { ScoreData, Scores } from '../../sharedTypes';

/**
 *
 * @param scoresRecent
 * @returns an array of scores sorted descending by score
 */
const calcTopScores = (scoresRecent: Scores): Scores =>
  [...scoresRecent].sort((a, b) => b.score - a.score);

/**
 *
 * @param scoresRecent
 * @returns and array of all score hashes
 */
const calcScoreHashed = (scoresRecent: Scores): string[] => {
  const scoredSongsHashes: string[] = [];

  scoresRecent.forEach((element) => scoredSongsHashes.push(element.songHash));

  return scoredSongsHashes;
};

/**
 *
 * @param scoresRecent
 * @returns ScoreData including recent scores, top scores and all score hashes
 */
const calcAllScores = (scoresRecent: Scores): ScoreData => {
  return {
    scoresRecent,
    scoredSongsHashes: calcScoreHashed(scoresRecent),
    scoresTop: calcTopScores(scoresRecent),
  };
};

export { calcScoreHashed, calcTopScores };

export default calcAllScores;
