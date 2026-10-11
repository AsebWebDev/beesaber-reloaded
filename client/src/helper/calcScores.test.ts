import { describe, expect, it } from 'vitest';

import exampleScores from '@/testing/testData/exampleScores';

import { calcScoreHashed, calcTopScores } from './calcScores';

describe('calcTopScores', () => {
  it('sorts by score, highest first', () => {
    expect(calcTopScores(exampleScores).map((score) => score.score)).toEqual([
      3000, 2000, 1000,
    ]);
  });

  it('leaves the given array untouched', () => {
    const before = exampleScores.map((score) => score.score);

    calcTopScores(exampleScores);

    expect(exampleScores.map((score) => score.score)).toEqual(before);
  });
});

describe('calcScoreHashed', () => {
  it('returns the song hash of every score, in order', () => {
    expect(calcScoreHashed(exampleScores)).toEqual(
      exampleScores.map((score) => score.songHash)
    );
  });
});
