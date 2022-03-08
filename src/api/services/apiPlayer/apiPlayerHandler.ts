import { rest } from 'msw';

import exampleScores from '@/testing/testData/exampleScores';
import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';

const handlers = [
  // getRecentScores
  rest.get(
    'https://new.scoresaber.com/api/player/:id/scores/recent/:count',
    (req, res, ctx) => res(ctx.status(200), ctx.json(exampleScores))
  ),

  // useGetPlayersByNameQuery
  rest.get(
    'https://new.scoresaber.com/api/players/by-name/:name',
    (req, res, ctx) =>
      res(ctx.status(200), ctx.json([exampleSSUserInfo.playerInfo]))
  ),

  // useGetPlayerByIdQuery
  rest.get('https://new.scoresaber.com/api/player/:id/full', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleSSUserInfo))
  ),
];

export default handlers;
