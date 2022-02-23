import { rest } from 'msw';

import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  rest.get('http://localhost:5001/api/user/:id', (req, res, ctx) => {
    console.log('handle: ', req.params.id);

    // If authenticated, return a mocked user details
    return res(ctx.status(200), ctx.json({ data: exampleUserData }));
  }),
];

export default handlers;
