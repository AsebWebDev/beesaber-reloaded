import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import baseInitialState from './baseInitialState';

const apiScoreSaber = createApi({
  reducerPath: 'apiScoreSaber',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://new.scoresaber.com/api',
  }),
  endpoints: () => ({}),
});

const initialState = Object.assign(baseInitialState, {
  config: { reducerPath: apiScoreSaber.reducerPath },
});

export { initialState };

export default apiScoreSaber;
