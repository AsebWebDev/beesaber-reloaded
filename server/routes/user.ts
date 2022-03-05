import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { isLoggedIn } from '../middlewares';

const router = express.Router();

router.post('/:id/', isLoggedIn, (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    User.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .then((userDoc: Express.User) => {
        if (!userDoc) {
          next(new Error('Could not find user.'));

          return;
        }
        res.json(userDoc);
      })
      .catch((err: unknown) => next(err));
  } else next(new Error('Invalid Mongoose User ID'));
});

router.get('/:id/', isLoggedIn, (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    User.findById(req.params.id)
      .then((userDoc: Express.User) => {
        if (!userDoc) {
          next(new Error('Could not find user.'));

          return;
        }
        res.json(userDoc);
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