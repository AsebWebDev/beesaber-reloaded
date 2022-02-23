import { rest } from 'msw';

import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  rest.get(
    'https://new.scoresaber.com/api/player/:id/full',
    (req, res, ctx) => {
      console.log('handle scoresabe: ', req.params.id);

      return res(ctx.status(200), ctx.json(exampleUserData));
    }
  ),
];

export default handlers;
