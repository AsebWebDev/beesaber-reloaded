import { errHandler, service } from './api';

import type { UserData } from '@/sharedTypes/UserData';
import type { PossibleResponses } from './api';

const userApi = {
  async getUserData(userId: string): Promise<unknown> {
    return service
      .get<UserData>('/user/' + userId)
      .then(({ data }) => data)
      .catch((err: unknown) => errHandler(err as PossibleResponses));
  },

  async saveUserData(
    userId: string,
    userdata: Partial<UserData>
  ): Promise<UserData | string> {
    return service
      .post<UserData>('/user/' + userId, userdata)
      .then<UserData>(({ data }) => data)
      .catch((err: unknown) => errHandler(err as PossibleResponses));
  },
};

export default userApi;
