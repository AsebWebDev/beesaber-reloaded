import { render, screen } from '@testing-library/react';

import exampleScores from '@/testing/testData/exampleScores';

import HighScoresForOneSong from './HighScoresForOneSong';

import type { Score } from '@/sharedTypes';

describe('components/common/ScoreBox/ScoreContent/HighScoresForOneSong', () => {
  const highscore = exampleScores[0];
  const highscorePlayedByHive = exampleScores[2];

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2021-12-01').getTime());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it.each`
    score                    | description
    ${highscore}             | ${'not played by hive'}
    ${highscorePlayedByHive} | ${'played by hive'}
  `(
    'should match snapshot is $description',
    async ({ score }: { score: Score }) => {
      render(
        <table>
          <tbody>
            <HighScoresForOneSong highscore={score} />
          </tbody>
        </table>
      );

      const component = await screen.findByTestId('highscore-for-one-song');

      expect(component).toMatchSnapshot();
    }
  );
});
