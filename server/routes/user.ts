import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { isLoggedIn } from '../middlewares';
import { Bee, UserData } from '../../sharedTypes';
import syncAll from '../helper/syncAll';
import getAllScores from './helper/getAllScores';
import updateAllScores from '../helper/updateAllScores';
import isUpdateNeeded from '../helper/IsUpdateNeeded';
import logger from 'node-color-log';
import { PlayedBy } from '../../sharedTypes/UserScores';

const router = express.Router();

type UserDocType = UserData & {
  toObject?: () => UserData;
};

router.post('/:id/', isLoggedIn, async (req, res, next) => {
  if (req.params.id !== undefined) {
    const mongoId = req.params.id;
    if (mongoose.Types.ObjectId.isValid(mongoId)) {
      User.findByIdAndUpdate(mongoId, req.body, { new: true })
        .then(async (userDoc: UserDocType) => {
          if (!userDoc) return next(new Error('Could not find user.'));

          const id = req.body.myScoreSaberId;
          const scoreData = await getAllScores(id);
          const newUser: UserData = { ...req.body, scoreData };
          logger.info(`Successfully updated user ${newUser.googleName}`);
          res.json(newUser);
        })
        .catch((err: unknown) => next(err));
    } else next(new Error('Invalid Mongoose User ID'));
  } else logger.warn('No ID in Params');
});

router.get('/:id/', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  let updatedUserData: UserData | undefined;

  if (id !== undefined) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      await User.findById(id)
        .then(async (userDoc: UserDocType) => {
          if (!userDoc) return next(new Error('Could not find user.'));

          // We parse mongoos userDoc to plain object and sync all scores
          const parsedUserData: UserData = userDoc.toObject();
          const updateNeeded = await isUpdateNeeded(parsedUserData);
          const userData = updateNeeded
            ? await updateAllScores(parsedUserData)
            : parsedUserData;
          const syncedUserData = await syncAll(userData);
          logger.info(`Successfully synced user ${syncedUserData.googleName}`);
          updatedUserData = { ...syncedUserData };
        })
        .catch((err: unknown) => next(err));

      await User.findByIdAndUpdate(
        { _id: id },
        updatedUserData as Express.User,
        {
          new: true,
        }
      )
        .then((userDoc: UserDocType) => {
          if (!userDoc) return next(new Error('Could not find user.'));

          const parsedUserData: UserData = userDoc.toObject();
          logger.info(`Successfully saved user ${updatedUserData.googleName}`);
          res.json(userDoc);
        })
        .catch((err: unknown) => next(err));
    }
  } else logger.warn('No ID in Params');
});

router.post('/:id/bee/delete', isLoggedIn, async (req, res, next) => {
  const { id: _id } = req.params;
  const { playerId } = req.body;

  if (playerId === undefined) return next(new Error('No playerId'));

  let updatedUserData: UserData | undefined;

  const filterBee = (bee: Bee | PlayedBy) => bee.playerId !== playerId;

  await User.findOne({ _id })
    .then((userDoc: UserDocType) => {
      if (!userDoc) return next(new Error('Could not find user.'));

      const parsedUserData: UserData = userDoc.toObject();

      // Remove this bee from hive and all playedBy scores
      updatedUserData = { ...parsedUserData };
      updatedUserData.bees = parsedUserData.bees.filter(filterBee);
      updatedUserData.scoreData.scoresRecent =
        parsedUserData.scoreData.scoresRecent.map((score) => {
          if (score.playedBy === undefined) return score;

          score.playedBy = score.playedBy?.filter(filterBee);
          if (score.playedBy.length === 0) score.playedByHive = false;

          return score;
        });
    })
    .catch((err: unknown) => next(err));

  await User.findByIdAndUpdate({ _id }, updatedUserData as Express.User, {
    new: true,
  })
    .then((userDoc: UserDocType) => {
      if (!userDoc) return next(new Error('Could not find user.'));

      const parsedUserData: UserData = userDoc.toObject();
      logger.info(`Successfully deleted bee with id ${playerId}`);
      res.json(userDoc);
    })
    .catch((err: unknown) => next(err));
  logger.debug('ENDE');
});

router.post('/:id/bee/update', isLoggedIn, (req, res, next) => {
  if (req.params.id !== undefined) {
    User.findByIdAndUpdate(
      { _id: req.params.id },
      { $set: { bees: req.body } },
      { new: true }
    )
      .then((userDoc: UserDocType) => {
        if (!userDoc) return next(new Error('Could not find user.'));

        const parsedUserData: UserData = userDoc.toObject();
        logger.info(
          `Successfully updated bees for ${parsedUserData.googleName}`
        );
        res.json(userDoc);
      })
      .catch((err: unknown) => next(err));
  } else logger.warn('No ID in Params');
});

router.post('/:id/bee', isLoggedIn, (req, res, next) => {
  if (req.params.id !== undefined) {
    User.findByIdAndUpdate(
      req.params.id,
      { $push: { bees: req.body } },
      {
        upsert: true,
        new: true,
      }
    )
      .then((userDoc: UserDocType) => {
        if (!userDoc) return next(new Error('Could not find user.'));
        const parsedUserData: UserData = userDoc.toObject();
        logger.info(`Successfully added bee for ${parsedUserData.googleName}`);
        res.json(userDoc);
      })
      .catch((err: unknown) => next(err));
  } else logger.warn('No ID in Params');
});

export default router;
