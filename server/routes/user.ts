import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { isLoggedIn } from '../middlewares';
import { UserData } from '../../sharedTypes';
import syncBeeScores from '../helper/syncBeeScores';
import getAllScores from './helper/getAllScores';
import updateAllScores from '../helper/updateAllScores';
import isUpdateNeeded from '../helper/IsUpdateNeeded';
import logger from 'node-color-log';

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
          if (!userDoc) {
            next(new Error('Could not find user.'));

            return;
          }
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

router.get('/:id/', isLoggedIn, (req, res, next) => {
  if (req.params.id !== undefined) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      User.findById(req.params.id)
        .then(async (userDoc: UserDocType) => {
          if (!userDoc) {
            next(new Error('Could not find user.'));

            return;
          }

          // We parse mongoos userDoc to plain object and sync all scores
          const parsedUserData: UserData = userDoc.toObject();
          const updateNeeded = await isUpdateNeeded(parsedUserData);
          const userData = updateNeeded
            ? await updateAllScores(parsedUserData)
            : parsedUserData;
          const syncedUserData = await syncBeeScores(userData);
          logger.info(`Successfully synced user ${syncedUserData.googleName}`);
          res.json(syncedUserData);
        })
        .catch((err: unknown) => next(err));
    }
  } else logger.warn('No ID in Params');
});

router.post('/:id/bee/update', isLoggedIn, (req, res, next) => {
  if (req.params.id !== undefined) {
    User.findByIdAndUpdate(
      {
        _id: req.params.id,
      },
      { $set: { bees: req.body } },
      {
        // safe: true, FIXME: Needed?
        new: true,
      }
    )
      .then((userDoc: UserDocType) => {
        if (!userDoc) {
          next(new Error('Could not find user.'));

          return;
        }
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
        // safe: true, FIXME: Needed?
        upsert: true,
        new: true,
      }
    )
      .then((userDoc: UserDocType) => {
        if (!userDoc) {
          next(new Error('Could not find user.'));

          return;
        }
        const parsedUserData: UserData = userDoc.toObject();
        logger.info(`Successfully added bee for ${parsedUserData.googleName}`);
        res.json(userDoc);
      })
      .catch((err: unknown) => next(err));
  } else logger.warn('No ID in Params');
});

export default router;
