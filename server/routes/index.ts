import express from 'express';
const router = express.Router();
// import { isLoggedIn, isAdmin } from '../middlewares'

// const mongoose = require('mongoose');

// EXAMPLE
// router.post('/checkheart', (req, res, next) => {
//   const GroupModel = mongoose.model(req.body.type)
//   GroupModel.findById(req.body.targetId)
//       .then(foundGroupModel => {
//         let likedSessions = foundGroupModel.likedSessions;      // array with sessionIDs that already did a like
//         let indexOfId = likedSessions.indexOf(req.sessionID);   // get the Index of Session ID. -1 = not found
//         (indexOfId !== -1) ? res.json(true) : res.json(false)   // already liked = return true, not liked yet = return false
//       }).catch(err => next(err))
// });

export default router;
