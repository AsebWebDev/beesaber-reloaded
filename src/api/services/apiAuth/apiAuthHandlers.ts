import { rest } from 'msw';

import { exampleGoogleUserData } from '@/testing/testData/exampleGoogleData';

const handlers = [
  // googleLogin
  rest.post('http://localhost:5001/api/googlelogin', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleGoogleUserData))
  ),

  // googleLogout
  rest.post('http://localhost:5001/api/logout', (req, res, ctx) =>
    res(ctx.status(200))
  ),

  // isValidMongoId
  rest.post('http://localhost:5001/api/checkValidMongoId', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(true))
  ),
];

export default handlers;
