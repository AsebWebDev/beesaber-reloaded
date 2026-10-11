import { rest } from 'msw';

import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  // getUserData
  rest.get('http://localhost:5001/api/user/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleUserData))
  ),
  // updateUserData
  rest.post('http://localhost:5001/api/user/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleUserData))
  ),
];

export default handlers;
