import { errHandler, service, validId } from './api';

import type { AxiosResponse } from 'axios';
import type { UserData } from '../sharedTypes/UserData';

const userApi = {
  async getUserData(
    userId: string
  ): Promise<AxiosResponse | Error | UserData | number> {
    if (validId(userId))
      return service
        .get<UserData>('/user/' + userId)
        .then(({ data }) => data)
        .catch(errHandler);
    else return Promise.resolve(0);
    // returning number,
    // see https://stackoverflow.com/questions/43881192/returning-a-promise-in-an-async-function-in-typescript
  },
};

export default userApi;
