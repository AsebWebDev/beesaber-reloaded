import axios from 'axios';
import mongoose from 'mongoose';

import googleApi from './googleApi';
import userApi from './userApi';

import type { AxiosError } from 'axios';
import type {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';

const service = axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? '/api'
      : 'http://localhost:5000/api',
  withCredentials: true,
});

type ErrorBody = {
  message: string;
};

type PossibleErrors =
  | AxiosError
  | Error
  | GoogleLoginResponse
  | GoogleLoginResponseOffline;

const errHandler = (err: PossibleErrors): Error => {
  if (axios.isAxiosError(err) && err.response !== undefined) {
    const data: ErrorBody = err.response.data;

    throw new Error(data.message);
  }
  if (err instanceof Error) throw new Error(err.message);
  if (err.code !== undefined) throw new Error(err.code);
  throw new Error('Unknown Error');
};

const validId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const api = {
  googleApi,
  userApi,
};

export type { PossibleErrors };

export { errHandler, service, validId };

export default api;
