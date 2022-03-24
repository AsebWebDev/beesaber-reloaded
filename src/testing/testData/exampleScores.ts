import { calcScoreHashed, calcTopScores } from '@/helper/calcScores';

import type { ScoreData, Scores } from '@/../sharedTypes';
import type { PlayedBy } from '@/../sharedTypes/UserScores';

const examplePlayedBy: PlayedBy = {
  beeScore: 2000,
  difficulty: 3,
  myScore: 3000,
  playerId: '12345',
  playerName: 'examplePlayer',
};

const exampleScores: Scores = [
  {
    difficulty: 9,
    difficultyRaw: '_ExpertPlus_SoloStandard',
    leaderboardId: 394004,
    levelAuthorName: 'Joshabi',
    maxScore: 0,
    mods: '',
    pp: 0,
    rank: 2,
    score: 1000,
    scoreId: 63279149,
    songAuthorName: 'Starset',
    songHash: '32C3A0E1FEE9FD589B795941B6D79AFE8061D30A',
    songName: 'It has Begun',
    songSubName: '',
    timeSet: '2021-11-12T02:11:52.000Z',
    unmodififiedScore: 595436,
    weight: 0,
  },
  {
    difficulty: 9,
    difficultyRaw: '_ExpertPlus_SoloStandard',
    leaderboardId: 394004,
    levelAuthorName: 'Joshabi',
    maxScore: 0,
    mods: '',
    playedByHive: true,
    pp: 0,
    rank: 2,
    score: 3000,
    scoreId: 63279150,
    songAuthorName: 'SongPlayedByHive',
    songHash: '32C3A0E1FEE9FD589B795941B6D79AFE8061D30C',
    songName: 'SongPlayedByHive',
    songSubName: '',
    timeSet: '2021-11-12T02:11:52.000Z',
    unmodififiedScore: 595436,
    weight: 0,
  },
  {
    difficulty: 9,
    difficultyRaw: '_ExpertPlus_SoloStandard',
    leaderboardId: 394004,
    levelAuthorName: 'Joshabi',
    maxScore: 0,
    mods: '',
    playedBy: [examplePlayedBy],
    playedByHive: true,
    pp: 0,
    rank: 2,
    score: 2000,
    scoreId: 63279151,
    songAuthorName: 'Stray from the Path',
    songHash: '32C3A0E1FEE9FD589B795941B6D79AFE8061D30B',
    songName: 'Let us make a deal',
    songSubName: '',
    timeSet: '2021-11-12T02:11:52.000Z',
    unmodififiedScore: 595436,
    weight: 0,
  },
];

const exampleScoreData: ScoreData = {
  scoredSongsHashes: calcScoreHashed(exampleScores),
  scoresRecent: exampleScores,
  scoresTop: calcTopScores(exampleScores),
};

export { exampleScoreData };

export default exampleScores;
