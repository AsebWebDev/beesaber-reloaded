import { exampleScoreData } from '@/testing/testData/exampleScores';

import type { Bee } from '@/../sharedTypes/Bee';

const exampleBee: Bee = {
  avatar: 'someAvatarString',
  country: 'en',
  playerId: '34365656',
  playerName: 'example Bee',
  rank: 4000,
  scoreData: exampleScoreData,
};

export default exampleBee;
