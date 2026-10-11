import axios from 'axios';
import { toast } from 'react-toastify';

import type { AxiosError } from 'axios';
import type {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';

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

export type { PossibleResponses };

export default errHandler;
