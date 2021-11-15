import type { Score } from '@/sharedTypes';

const isInQuery = (score: Score, query: string): boolean => {
  const { songName, songAuthorName } = score;

  return (
    songName.toLowerCase().includes(query.toLowerCase()) ||
    songAuthorName.toLowerCase().includes(query.toLowerCase())
  );
};

export default isInQuery;
