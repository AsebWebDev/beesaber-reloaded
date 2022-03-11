import { rest } from 'msw';

import { exampleScoreData } from '@/testing/testData/exampleScores';
import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';

const baseLocalUrl = 'http://localhost:5001/api';

const handlers = [
  // getAllScores
  rest.get(`${baseLocalUrl}/player/:id/allscores`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleScoreData))
  ),

  // getPlayersByName
  rest.get(`${baseLocalUrl}/player/:name/playersbyname`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json([exampleSSUserInfo.playerInfo]))
  ),

  // getPlayerById
  rest.get(`${baseLocalUrl}/player/:id/playerbyid/`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(exampleSSUserInfo))
  ),
  // isValidPlayerId
  rest.get(`${baseLocalUrl}/player/:id/isvalidplayerid/`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(true))
  ),
];

export default handlers;
