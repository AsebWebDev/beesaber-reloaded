import type { Score, Scores } from '@/sharedTypes';

const isInQuery = (score: Score, query: string): boolean => {
  if (query === '') return true;

  // check for string only containing blank spaces
  if (query.replace(/\s/g, '').length === 0) return false;

  const { songName, songAuthorName } = score;

  return (
    songName.toLowerCase().includes(query.toLowerCase()) ||
    songAuthorName.toLowerCase().includes(query.toLowerCase())
  );
};

const filterScores = (
  scores: Scores,
  query: string,
  isPlayedByHive: boolean
): Scores =>
  scores.filter((score) =>
    isPlayedByHive
      ? isInQuery(score, query) && score.playedByHive
      : isInQuery(score, query)
  );

export { isInQuery };

export default filterScores;
