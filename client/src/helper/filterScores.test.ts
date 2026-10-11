import { describe, expect, it } from 'vitest';

import exampleScores from '@/testing/testData/exampleScores';

import filterScores from './filterScores';

const songNames = (scores: typeof exampleScores) =>
  scores.map((score) => score.songName);

describe('filterScores', () => {
  it('returns all scores for an empty query', () => {
    expect(filterScores(exampleScores, '', false)).toEqual(exampleScores);
  });

  it('matches the song name, ignoring case', () => {
    expect(songNames(filterScores(exampleScores, 'IT HAS', false))).toEqual([
      'It has Begun',
    ]);
  });

  it('matches the song author', () => {
    expect(songNames(filterScores(exampleScores, 'stray', false))).toEqual([
      'Let us make a deal',
    ]);
  });

  it('returns nothing for a query of only blanks', () => {
    expect(filterScores(exampleScores, '   ', false)).toEqual([]);
  });

  it('keeps only songs played by the hive when asked to', () => {
    expect(songNames(filterScores(exampleScores, '', true))).toEqual([
      'SongPlayedByHive',
      'Let us make a deal',
    ]);
  });

  it('combines the query with the hive filter', () => {
    expect(songNames(filterScores(exampleScores, 'deal', true))).toEqual([
      'Let us make a deal',
    ]);
    expect(filterScores(exampleScores, 'begun', true)).toEqual([]);
  });
});
