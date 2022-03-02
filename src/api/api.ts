import axios from 'axios';
import { toast } from 'react-toastify';

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
      : 'http://localhost:5001/api',
});

type ErrorBody = {
  message: string;
};

type PossibleResponses =
  | AxiosError
  | Error
  | GoogleLoginResponse
  | GoogleLoginResponseOffline;

const errHandler = (err: PossibleResponses): string => {
  let errorString = 'Unknown Error';

  if (axios.isAxiosError(err) && err.response !== undefined) {
    const data: ErrorBody = err.response.data;

    errorString = data.message;
  }
  if (err instanceof Error) {
    errorString = err.message;
  }

  if (errorString.length > 0) toast.error(errorString);

  return errorString;
};

const api = {
  userApi,
};

export type { PossibleResponses };

export { errHandler, service };

export default api;
