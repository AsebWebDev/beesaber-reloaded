import { configureStore } from '@reduxjs/toolkit';

import rootReducer, { initialState } from './reducer/rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  devTools: true,
});

export { initialState };
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
