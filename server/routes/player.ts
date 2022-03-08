import axios, { AxiosResponse } from 'axios';
import { isLoggedIn } from '../middlewares';
import express from 'express';
import { calcScoreHashed, calcTopScores } from './helper/calcScores';
import getRecentScores from './helper/getRecentScores';
const router = express.Router();

const baseUrl = 'https://new.scoresaber.com/api';

router.get('/:id/allscores/', isLoggedIn, async (req, res, next) => {
  console.log('All scores');
  const id = req.params.id;
  const threshold = 10;
  const scoresRecent = await getRecentScores({ id, threshold });

  const result = {
    scoredSongsHashes: calcScoreHashed(scoresRecent),
    scoresRecent,
    scoresTop: calcTopScores(scoresRecent),
  };

  res.json(result);
});

router.get('/:id/playerbyid/', isLoggedIn, async (req, res, next) => {
  const id = req.params.id;
  const url = `${baseUrl}/player/${id}/full`;

  try {
    const result = await axios.get(url);
    res.json(result.data);
  } catch (err) {
    next();
  }
});

router.get('/:name/playersbyname/', isLoggedIn, async (req, res, next) => {
  const name = req.params.name;
  const url = `${baseUrl}/player/${name}/full`;
  const result = await axios.get(url);
  res.json(result.data.players);
});

router.get('/:id/isvalidplayerid/', isLoggedIn, async (req, res, next) => {
  console.log('isvalidplayerid');
  const id = req.params.id;
  const url = `${baseUrl}/player/${id}/full`;
  try {
    const result: AxiosResponse = await axios.get(url);
    return res.json(result.status === 200 && result.data !== undefined);
  } catch (err) {
    return res.json(false);
  }
});

router.get('/:id/recentScores/:count', isLoggedIn, async (req, res, next) => {
  const id = req.params.id;
  const count = req.params.count;
  const url = `${baseUrl}/player/${id}/scores/recent/${count}`;
  const result = await axios.get(url);
  res.json(result.data);
});

export default router;
