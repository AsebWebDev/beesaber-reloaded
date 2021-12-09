import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import baseInitialState from './baseInitialState';

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:5000/api',
  }),
  endpoints: () => ({}),
});

const initialState = Object.assign(baseInitialState, {
  config: { reducerPath: api.reducerPath },
});

export { initialState };

export default api;
