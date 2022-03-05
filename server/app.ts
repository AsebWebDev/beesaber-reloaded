import path from 'path';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import logger from 'morgan';
import nocache from 'nocache';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import passport from './passport';
import indexRoutes from './routes/index';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import './configs/database';
import type { ErrnoException } from './types/global';

const MongoStore = connectMongo(session);

dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.set('useFindAndModify', false); // prevent deprecation warning of fineByIdAndUpdate()

const app = express();

app.use(nocache());
app.use(
  cors({
    // Set "Access-Control-Allow-Origin" header --> allow Google Auth Login
    origin: (origin, cb) => {
      cb(
        null,
        origin &&
          (origin.startsWith('https://accounts.google.com') ||
            origin.startsWith('http://localhost:'))
      );
    },
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client/build')));

passport(app);

// Enable authentication using session + passport
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// ===================
//     R O U T E S
// ===================
app.use('/api', indexRoutes);
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);

// For any routes that starts with "/api", catch 404 and forward to error handler
app.use('/api/*', (_req, _res, next) => {
  const err: ErrnoException = new Error('Not Found');

  err.status = 404;
  next(err);
});

// For any other routes, redirect to the index.html file of React
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// ==================================
//     E R R O R   H A N D L E R
// ==================================
app.use(
  (
    err: ErrnoException,
    _req: any,
    res: {
      headersSent: any;
      status: (arg0: number) => void;
      json: (arg0: ErrnoException) => void;
    },
    _next: any
  ) => {
    console.error('----- An error happened -----');
    console.error(err);

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      res.status(err.status || 500);

      // A limited amount of information sent in production
      if (process.env.NODE_ENV === 'production') res.json(err);
      else
        res.json(
          JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        );
    }
  }
);

export default app;
