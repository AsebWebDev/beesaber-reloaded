import { rest } from 'msw';

import exampleScores from '@/testing/testData/exampleScores';
import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';
import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  // getRecentScoresUrl
  rest.get(
    'https://new.scoresaber.com/api/player/:id/scores/recent/:count',
    (req, res, ctx) => res(ctx.status(200), ctx.json(exampleScores))
  ),

  // useGetPlayersByNameQuery
  rest.get(
    'https://new.scoresaber.com/api/players/by-name/:name',
    (req, res, ctx) => {
      console.log('name: ', req.params.name);

      return res(ctx.status(200), ctx.json([exampleSSUserInfo.playerInfo]));
    }
  ),

  // useGetFullPlayerQuery
  rest.get(
    'https://new.scoresaber.com/api/player/:id/full',
    (req, res, ctx) => {
      console.log('handle scoresabe: ', req.params.id);

      return res(ctx.status(200), ctx.json(exampleUserData));
    }
  ),
];

export default handlers;
