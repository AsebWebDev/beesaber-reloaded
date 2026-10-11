import { http, HttpResponse } from 'msw';

import exampleUserData from '@/testing/testData/exampleUserData';

const handlers = [
  // getUserData
  http.get('/api/user/:id', () => HttpResponse.json(exampleUserData)),

  // updateUserData
  http.post('/api/user/:id', () => HttpResponse.json(exampleUserData)),
];

export default handlers;
