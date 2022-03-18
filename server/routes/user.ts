import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { isLoggedIn } from '../middlewares';
import { UserData } from '../../sharedTypes';
import syncBeeScores from '../helper/syncBeeScores';
import getAllScores from './helper/getAllScores';
import updateAllScores from '../helper/updateAllScores';
import isUpdateNeeded from '../helper/IsUpdateNeeded';
const router = express.Router();

type UserDocType = UserData & {
  toObject?: () => UserData;
};

router.post('/:id/', isLoggedIn, async (req, res, next) => {
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
        const newUser = { ...req.body, scoreData: scoreData };
        res.json(newUser);
      })
      .catch((err: unknown) => next(err));
  } else next(new Error('Invalid Mongoose User ID'));
});

router.get('/:id/', isLoggedIn, (req, res, next) => {
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

        res.json(syncedUserData);
      })
      .catch((err: unknown) => next(err));
  }
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
      .then((userDoc: Express.User) => {
        if (!userDoc) {
          next(new Error('Could not find user.'));

          return;
        }
        res.json(userDoc);
      })
      .catch((err: unknown) => next(err));
  } else console.log('No ID in Params');
});

router.post('/:id/bee', isLoggedIn, (req, res, next) => {
  User.findByIdAndUpdate(
    req.params.id,
    { $push: { bees: req.body } },
    {
      // safe: true, FIXME: Needed?
      upsert: true,
      new: true,
    }
  )
    .then((userDoc: Express.User) => {
      if (!userDoc) {
        next(new Error('Could not find user.'));

        return;
      }
      res.json(userDoc);
    })
    .catch((err: unknown) => next(err));
});

// router.get('/:id/settings', isLoggedIn, (req, res, next) => {
// User.findById(req.params.id)
// .then(userDoc => {
//   if (!userDoc) {
//     next(new Error("Could not find user settings."))
//     return
//   }
//   res.json(userDoc.settings)
// })
// .catch(err => next(err))
// });

// router.post('/:id/settings', isLoggedIn, (req, res, next) => {
// User.findByIdAndUpdate(req.params.id, { settings: req.body }, { new: true })
// .then(userDoc => {
//   if (!userDoc) {
//     next(new Error("Could not find user settings."))
//     return
//   }
//   console.log("TCL: userDoc.settings", userDoc.settings)
//   res.json(userDoc.settings)
// })
// .catch(err => next(err))
// });

export default router;
