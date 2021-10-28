import axios from 'axios';
import { toast } from 'react-toastify';

import authApi from './authApi';
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
  let errorString = 'Unknown Error';

  if (axios.isAxiosError(err) && err.response !== undefined) {
    const data: ErrorBody = err.response.data;

    errorString = data.message;
  }
  if (err instanceof Error) errorString = err.message;

  toast.error(errorString);
  throw new Error(errorString);
};

const api = {
  authApi,
  userApi,
};

export type { PossibleErrors };

export { errHandler, service };

export default api;
