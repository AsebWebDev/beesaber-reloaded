import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const apiInitialState = {
  queries: {},
  mutations: {},
  provided: {},
  subscriptions: {},
  config: {
    online: true,
    focused: true,
    middlewareRegistered: true,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
    keepUnusedDataFor: 0,
  },
};

const api = createApi({
  tagTypes: ['UserData', 'Scores', 'ScoreSaberUserInfo'],
  baseQuery: fetchBaseQuery({}),
  endpoints: () => ({}),
});

export { apiInitialState };

export default api;
