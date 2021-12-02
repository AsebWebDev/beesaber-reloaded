import exampleUserScores from '@/testing/testData/exampleUserScores';

import { isInQuery } from './filterScores';

const score = exampleUserScores.scores[0];

type Props = {
  query: string;
  result: boolean;
};

describe('isInQuery', () => {
  it.each`
    name              | authorName              | query      | result
    ${score.songName} | ${score.songAuthorName} | ${'begun'} | ${true}
    ${score.songName} | ${score.songAuthorName} | ${'star'}  | ${true}
    ${score.songName} | ${score.songAuthorName} | ${'Vader'} | ${false}
    ${score.songName} | ${score.songAuthorName} | ${'   '}   | ${false}
  `(
    'should return $result when query is "$query" and song is "$name" by "$authorName"',
    ({ query, result }: Props) => {
      expect(isInQuery(score, query)).toBe(result);
    }
  );
});

describe('filterScores', () => {
  it.todo('should return filtered scores');
});
