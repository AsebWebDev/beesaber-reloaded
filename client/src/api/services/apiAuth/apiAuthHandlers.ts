import { rest } from 'msw';

import { exampleGoogleUserData } from '@/testing/testData/exampleGoogleData';

const handlers = [
  // googleLogin
  rest.post('/api/googlelogin', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleGoogleUserData))
  ),

  // googleLogout
  rest.post('/api/logout', (req, res, ctx) => res(ctx.status(200))),

  // isValidMongoId
  rest.get('/api/checkValidMongoId/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(true))
  ),
];

export default handlers;
