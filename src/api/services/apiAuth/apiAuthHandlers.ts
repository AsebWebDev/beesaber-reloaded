import { rest } from 'msw';

import { exampleGoogleUserData } from '@/testing/testData/exampleGoogleData';

const handlers = [
  // googleLogin
  rest.post('http://localhost:5001/api/googlelogin', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleGoogleUserData))
  ),
];

export default handlers;
