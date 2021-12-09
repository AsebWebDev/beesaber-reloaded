const baseInitialState = {
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
    keepUnusedDataFor: 60,
    reducerPath: '',
  },
};

export default baseInitialState;
