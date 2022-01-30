import { rest } from 'msw';

import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  rest.get('http://localhost:5001/api/user/:id', (req, res, ctx) => {
    console.log('handle: ', req.params.id);

    // If authenticated, return a mocked user details
    return res(ctx.status(200), ctx.json({ data: exampleUserData }));
  }),
  rest.get(
    'https://new.scoresaber.com/api/player/:id/full',
    (req, res, ctx) => {
      console.log('handle scoresabe: ', req.params.id);

      // If authenticated, return a mocked user details
      return res(ctx.status(200), ctx.json(exampleUserData));
    }
  ),
  rest.post('/login', (req, res, ctx) => {
    // Persist user's authentication in the session
    sessionStorage.setItem('is-authenticated', 'true');

    return res(
      // Respond with a 200 status code
      ctx.status(200)
    );
  }),
  rest.get('/user', (req, res, ctx) => {
    // Check if the user is authenticated in this session
    const isAuthenticated = sessionStorage.getItem('is-authenticated');

    if (!isAuthenticated) {
      // If not authenticated, respond with a 403 error
      return res(
        ctx.status(403),
        ctx.json({
          errorMessage: 'Not authorized',
        })
      );
    }

    // If authenticated, return a mocked user details
    return res(
      ctx.status(200),
      ctx.json({
        username: 'admin',
      })
    );
  }),
];

export default handlers;
