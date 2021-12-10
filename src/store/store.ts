import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/dist/query/react';

import api, { initialState as apiInitialState } from '@/api/services/api';
import { apiAuth } from '@/api/services/apiAuth/apiAuth';
import { apiPlayer } from '@/api/services/apiPlayer/apiPlayer';
import apiScoreSaber, {
  initialState as apiScoreSaberInitialState,
} from '@/api/services/apiScoreSaber';
import { apiUser } from '@/api/services/apiUser/apiUser';

import { initialState as appStatusInitialState } from './reducer/appStatusReducer';
import { initialState as notificationsInitialState } from './reducer/notificationsReducer';
import rootReducer from './reducer/rootReducer';
import { initialState as userDataInitialState } from './reducer/userDataReducer';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiAuth.middleware,
      apiPlayer.middleware,
      apiUser.middleware
    ),
  devTools: true,
});

setupListeners(store.dispatch);

const initialState: RootState = {
  appStatus: { ...appStatusInitialState },
  notifications: { ...notificationsInitialState },
  userData: { ...userDataInitialState },
  [api.reducerPath]: { ...apiInitialState },
  [apiScoreSaber.reducerPath]: { ...apiScoreSaberInitialState },
};

export { initialState };

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
