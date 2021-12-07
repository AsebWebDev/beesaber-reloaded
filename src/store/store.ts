import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/dist/query/react';

import { apiAuth } from '@/api/services/apiAuth/apiAuth';
import { apiUser } from '@/api/services/apiUser/apiUser';

import rootReducer, { initialState } from './reducer/rootReducer';

const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiAuth.middleware, apiUser.middleware),
  devTools: true,
});

setupListeners(store.dispatch);

export default store;

export { initialState };
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
