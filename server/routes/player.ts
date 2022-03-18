import axios, { AxiosResponse } from 'axios';
import { isLoggedIn } from '../middlewares';
import express from 'express';
import getAllScores from './helper/getAllScores';
import getPlayerById from './helper/getPlayerById';
const router = express.Router();

const baseUrl = 'https://new.scoresaber.com/api';

router.get('/:id/allscores/', isLoggedIn, async (req, res, next) => {
  const id = req.params.id;
  const result = await getAllScores(id);

  res.json(result);
});

router.get('/:id/playerbyid/', isLoggedIn, async (req, res, next) => {
  const id = req.params.id;
  const isNumeric = /^\d+$/.test(id);
  if (!isNumeric) return;

  try {
    const result = await getPlayerById(id);
    return res.status(200).json(result);
  } catch (err: unknown) {
    res.status(404).json(err);
  }
});

router.get('/:name/playersbyname/', isLoggedIn, async (req, res, next) => {
  try {
    const url = `${baseUrl}/players/by-name/${req.params.name}`;
    const result: AxiosResponse = await axios.get(url);
    res.json(result.data.players);
  } catch (err: unknown) {
    res.status(404).json(err);
  }
});

router.get('/:id/isvalidplayerid/', isLoggedIn, async (req, res, next) => {
  const url = `${baseUrl}/player/${req.params.id}/full`;
  try {
    const result: AxiosResponse = await axios.get(url);
    res.json(result.status === 200 && result.data !== undefined);
  } catch (err) {
    res.json(false);
  }
});

router.get('/:id/recentScores/:count', isLoggedIn, async (req, res, next) => {
  const id = req.params.id;
  const count = req.params.count;

  try {
    const url = `${baseUrl}/player/${id}/scores/recent/${count}`;
    const result = await axios.get(url);

    res.json(result.data);
  } catch (err: unknown) {
    res.status(404).json(err);
  }
});

export default router;
