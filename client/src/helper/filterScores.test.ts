import exampleScores from '@/testing/testData/exampleScores';

import { filterScores, isInQuery } from './filterScores';

describe('isInQuery', () => {
  const score = exampleScores[0];

  type Props = {
    query: string;
    result: boolean;
  };

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
  type Props = {
    isPlayedByHive: boolean;
    query: string;
    result: number;
  };

  it.each`
    isPlayedByHive | query            | result
    ${false}       | ${'begun'}       | ${1}
    ${false}       | ${'notInScores'} | ${0}
    ${true}        | ${'Hive'}        | ${1}
    ${true}        | ${''}            | ${2}
  `(
    'should return $result filtered scores when query is "$query" and isPlayedByHive is $isPlayedByHive',
    ({ query, result, isPlayedByHive }: Props) => {
      expect(filterScores(exampleScores, query, isPlayedByHive)).toHaveLength(
        result
      );
    }
  );
});
