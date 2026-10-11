import { http, HttpResponse } from 'msw';

import { exampleScoreData } from '@/testing/testData/exampleScores';
import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';

const handlers = [
  // getAllScores
  http.get('/api/player/:id/allscores', () =>
    HttpResponse.json(exampleScoreData)
  ),

  // getPlayersByName
  http.get('/api/player/:name/playersbyname', () =>
    HttpResponse.json([exampleSSUserInfo.playerInfo])
  ),

  // getPlayerById
  http.get('/api/player/:id/playerbyid/', () =>
    HttpResponse.json(exampleSSUserInfo)
  ),

  // isValidPlayerId
  http.get('/api/player/:id/isvalidplayerid/', () => HttpResponse.json(true)),
];

export default handlers;
