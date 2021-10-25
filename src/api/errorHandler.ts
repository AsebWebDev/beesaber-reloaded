import type { AxiosError } from 'axios';

const errHandler = (err: AxiosError): void => {
  if (err.response?.data !== undefined) {
    throw err.response.data.message;
  }
  throw err;
};

export default errHandler;
