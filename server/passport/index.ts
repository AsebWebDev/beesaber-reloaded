import passport from 'passport';

import './serializers';
import './localStrategy';
import { Handler } from 'express';

export default (app: { use: (arg0: Handler) => void }) => {
  app.use(passport.initialize());
  app.use(passport.session());
};
