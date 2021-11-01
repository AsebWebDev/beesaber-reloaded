import api, { errHandler, service } from './api';

import type { AxiosResponse } from 'axios';
import type { UserData } from '@/sharedTypes/UserData';
import type { PossibleResponses } from './api';

const userApi = {
  async getUserData(
    userId: string
  ): Promise<AxiosResponse | Error | UserData | number | string> {
    if (await api.authApi.isValidMongoId(userId))
      return service
        .get<UserData>('/user/' + userId)
        .then(({ data }) => data)
        .catch((err: unknown) => errHandler(err as PossibleResponses));
    // returning number,
    // see https://stackoverflow.com/questions/43881192/returning-a-promise-in-an-async-function-in-typescript
    else return Promise.resolve(0);
  },
};

export default userApi;
