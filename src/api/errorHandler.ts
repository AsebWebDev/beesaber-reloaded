import type { AxiosError } from 'axios';

const errHandler = (err: AxiosError) => {
  if (err.response && err.response.data) {
    console.error('API response', err.response.data);
    throw err.response.data.message;
  }
  throw err;
};

export default errHandler;
