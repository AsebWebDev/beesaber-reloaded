import type { AxiosError } from 'axios';

type ErrorBody = {
  message: string;
};

const errHandler = (err: AxiosError): Error => {
  if (err.response !== undefined) {
    const data: ErrorBody = err.response.data;

    throw new Error(data.message);
  }
  throw err;
};

export default errHandler;
