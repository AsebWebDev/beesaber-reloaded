import { calcScoreHashed, calcTopScores } from '@/helper/calcScores';
import exampleScores from '@/testing/testData/exampleScores';

describe('calcScores', () => {
  it('calcScoreHashed should return array of hashes', () => {
    expect(calcScoreHashed(exampleScores)).toMatchSnapshot();
  });

  it('calcTopScores should return sorted scores by top rating', () => {
    const sortedScores = calcTopScores(exampleScores);

    expect(sortedScores[0].score > sortedScores[1].score).toBe(true);
    expect(sortedScores).toMatchSnapshot();
  });
});
