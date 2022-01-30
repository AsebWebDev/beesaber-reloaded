import type ScoreSaberUserInfo from '@/sharedTypes/ScoreSaberUserInfo';

const exampleSSUserInfo: ScoreSaberUserInfo = {
  playerInfo: {
    avatar: '/api/static/avatars/76561198333869741.jpg',
    badges: [
      {
        image: 'BSWC-2020-1.png',
        description: 'Beat Saber World Cup 2020: 1st Place (United States)',
      },
    ],
    banned: 0,
    country: 'US',
    countryRank: 1,
    history: '1,1,',
    inactive: 0,
    permissions: 2,
    playerId: '76561198333869741',
    playerName: 'cerret',
    pp: 15449.6,
    rank: 1,
    role: 'Quality Assurance Team',
  },
  scoreStats: {
    averageRankedAccuracy: 95.32369830061569,
    rankedPlayCount: 756,
    totalPlayCount: 3138,
    totalRankedScore: 1091614527,
    totalScore: 4230658506,
  },
};

const anotherExampleSSUserInfo: ScoreSaberUserInfo = {
  playerInfo: {
    avatar: '/api/static/avatars/76561198333869741.jpg',
    badges: [],
    banned: 0,
    country: 'UK',
    countryRank: 22,
    history: '1,1,',
    inactive: 0,
    permissions: 2,
    playerId: '765611983338693333',
    playerName: 'darthVader ',
    pp: 15449.6,
    rank: 1222,
    role: 'Destruction Team',
  },
  scoreStats: {
    averageRankedAccuracy: 87.32369830061569,
    rankedPlayCount: 76,
    totalPlayCount: 318,
    totalRankedScore: 1091614,
    totalScore: 42308506,
  },
};

const examplePlayerInfos = [
  exampleSSUserInfo.playerInfo,
  anotherExampleSSUserInfo.playerInfo,
];

export { examplePlayerInfos };

export default exampleSSUserInfo;
