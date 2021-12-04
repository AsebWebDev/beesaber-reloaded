import exampleScores from '@/testing/testData/exampleScores';
import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';
import exampleUserData from '@/testing/testData/exampleUserData';

import parseUserData from './parseUserData';

describe('parseUserData', () => {
  it('should parse correct UserData', () => {
    const exampleUserScores = { scores: [exampleScores[0]] };

    const result = parseUserData(
      exampleUserData,
      exampleSSUserInfo,
      exampleUserScores
    );

    expect(result).toStrictEqual({
      googleId: '123',
      googleImageUrl: 'https://some-image.url',
      googleName: 'Darth Vader',
      profilePic: '/api/static/avatars/76561198333869741.jpg',
      username: 'cerret',
      __v: 0,
      _id: '',
      bees: [],
      created_at: '',
      isAdmin: false,
      myIntersections: [],
      myScoreSaberId: '',
      news: [],
      scoreData: {
        scoredSongsHashes: ['32C3A0E1FEE9FD589B795941B6D79AFE8061D30C'],
        scoresRecent: [
          {
            difficulty: 9,
            difficultyRaw: '_ExpertPlus_SoloStandard',
            leaderboardId: 394004,
            levelAuthorName: 'Joshabi',
            maxScore: 0,
            mods: '',
            pp: 0,
            rank: 2,
            score: 595436,
            scoreId: 63279149,
            songAuthorName: 'Starset',
            songHash: '32C3A0E1FEE9FD589B795941B6D79AFE8061D30C',
            songName: 'It has Begun',
            songSubName: '',
            timeSet: '2021-11-12T02:11:52.000Z',
            unmodififiedScore: 595436,
            weight: 0,
          },
        ],
        scoresTop: [
          {
            difficulty: 9,
            difficultyRaw: '_ExpertPlus_SoloStandard',
            leaderboardId: 394004,
            levelAuthorName: 'Joshabi',
            maxScore: 0,
            mods: '',
            pp: 0,
            rank: 2,
            score: 595436,
            scoreId: 63279149,
            songAuthorName: 'Starset',
            songHash: '32C3A0E1FEE9FD589B795941B6D79AFE8061D30C',
            songName: 'It has Begun',
            songSubName: '',
            timeSet: '2021-11-12T02:11:52.000Z',
            unmodififiedScore: 595436,
            weight: 0,
          },
        ],
      },
      settings: {
        Design: {
          boxShadow: { name: '', val: '' },
          theme: { name: '', val: '' },
        },
        Performance: { intervalUpdatecheck: { name: '', val: '' } },
      },
      updated_at: '',
      rank: 1,
      scoreStats: {
        averageRankedAccuracy: 95.32369830061569,
        rankedPlayCount: 756,
        totalPlayCount: 3138,
        totalRankedScore: 1091614527,
        totalScore: 4230658506,
      },
    });
  });
});
