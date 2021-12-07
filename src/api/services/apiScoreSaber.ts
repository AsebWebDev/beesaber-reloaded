import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// initialize an empty api service that we'll inject endpoints into later as needed
const apiScoreSaber = createApi({
  reducerPath: 'apiScoreSaber',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://new.scoresaber.com/api',
  }),
  endpoints: () => ({}),
});

export default apiScoreSaber;
