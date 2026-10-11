import { rest } from 'msw';

import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  // getUserData
  rest.get('/api/user/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleUserData))
  ),
  // updateUserData
  rest.post('/api/user/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleUserData))
  ),
];

export default handlers;
