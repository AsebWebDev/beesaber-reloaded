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
  tagTypes: ['UserData', 'PlayerInfo', 'Scores', 'ScoreSaberUserInfo'],
  // An absolute URL, so requests also work where no page URL exists to
  // resolve a relative one against, such as in tests. In development the Vite
  // dev server forwards /api to the server.
  baseQuery: fetchBaseQuery({ baseUrl: `${window.location.origin}/api` }),
  endpoints: () => ({}),
});

export { apiInitialState };

export default api;
