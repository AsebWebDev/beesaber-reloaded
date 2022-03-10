/* eslint-disable @typescript-eslint/no-explicit-any */
// Code based on: https://medium.com/@johnmcdowell0801/testing-rtk-query-with-jest-cdfa5aaf3dc1
import { combineReducers, configureStore } from '@reduxjs/toolkit';

import type {
  AnyAction,
  DeepPartial,
  EnhancedStore,
  Middleware,
  Reducer,
} from '@reduxjs/toolkit';

function setupApiStore<
  A extends {
    middleware: Middleware;
    reducer: Reducer<any, any>;
    reducerPath: string;
    util: { resetApiState: () => any };
  },
  R extends Record<string, Reducer<any, any>> = Record<never, never>
>(
  api: A,
  extraReducers?: R,
  preloadedState?: DeepPartial<any>
): { api: any; store: EnhancedStore } {
  /*
   * Modified version of RTK Query's helper function:
   * https://github.com/reduxjs/redux-toolkit/blob/master/packages/toolkit/src/query/tests/helpers.tsx
   */
  const getStore = (): EnhancedStore =>
    configureStore({
      reducer: combineReducers({
        [api.reducerPath]: api.reducer,
        ...extraReducers,
      }),
      preloadedState,
      middleware: (gdm) =>
        gdm({ serializableCheck: false, immutableCheck: false }).concat(
          api.middleware
        ),
    });

  type StoreType = EnhancedStore<
    // eslint-disable-next-line @typescript-eslint/sort-type-union-intersection-members
    {
      api: ReturnType<A['reducer']>;
    } & {
      [K in keyof R]: ReturnType<R[K]>;
    },
    AnyAction,
    ReturnType<typeof getStore> extends EnhancedStore<any, any, infer M>
      ? M
      : never
  >;

  const initialStore = getStore() as StoreType;
  const refObj = {
    api,
    store: initialStore,
  };
  const store = getStore() as StoreType;

  refObj.store = store;

  return refObj;
}

export default setupApiStore;
