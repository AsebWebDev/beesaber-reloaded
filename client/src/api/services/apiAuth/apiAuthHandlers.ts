import { http, HttpResponse } from 'msw';

import { exampleGoogleUserData } from '@/testing/testData/exampleGoogleData';

const handlers = [
  // googleLogin
  http.post('/api/googlelogin', () => HttpResponse.json(exampleGoogleUserData)),

  // googleLogout
  http.post('/api/logout', () => new HttpResponse(null, { status: 200 })),

  // isValidMongoId
  http.get('/api/checkValidMongoId/:id', () => HttpResponse.json(true)),
];

export default handlers;
