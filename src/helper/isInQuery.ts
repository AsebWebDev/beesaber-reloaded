import type { Score } from '@/sharedTypes';

const isInQuery = (score: Score, query: string): boolean => {
  // check for empty query
  if (query.replace(/\s/g, '').length === 0) return false;

  const { songName, songAuthorName } = score;

  return (
    songName.toLowerCase().includes(query.toLowerCase()) ||
    songAuthorName.toLowerCase().includes(query.toLowerCase())
  );
};

export default isInQuery;
