import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';

import api, { apiInitialState } from '@/api/api';

import { initialState as appStatusInitialState } from './reducer/appStatusReducer';
import { initialState as notificationsInitialState } from './reducer/notificationsReducer';
import rootReducer from './reducer/rootReducer';
import { initialState as userDataInitialState } from './reducer/userDataReducer';

// A function, so every test can work on a store of its own
const createAppStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      // All services inject their endpoints into the same api, so there is
      // exactly one middleware to register.
      getDefaultMiddleware().concat(api.middleware),
    devTools: true,
  });

const store = createAppStore();

setupListeners(store.dispatch);

const initialState = {
  appStatus: { ...appStatusInitialState },
  notifications: { ...notificationsInitialState },
  userData: { ...userDataInitialState },
  api: { ...apiInitialState },
};

export { createAppStore, initialState };

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
