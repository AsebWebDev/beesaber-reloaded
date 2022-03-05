import passport from 'passport';
import User from '../models/User';

type LoggedInUser = Express.User & {
  _id: string;
};

passport.serializeUser((loggedInUser: LoggedInUser, cb) => {
  cb(null, loggedInUser._id);
});

passport.deserializeUser((userIdFromSession, cb) => {
  User.findById(userIdFromSession)
    .then((userDocument: Express.User) => {
      cb(null, userDocument);
    })
    .catch((err: unknown) => {
      cb(err);
    });
});
