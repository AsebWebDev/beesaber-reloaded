import { errHandler, service, validId } from './api';

import type { UserData } from '../sharedTypes/UserData';

const userApi = {
  async getUserData(userId: string) {
    if (validId(userId))
      return service
        .get<UserData>('/user/' + userId)
        .then(({ data }) => data)
        .catch(errHandler);
    else return Promise.resolve();
  },
};

export default userApi;
