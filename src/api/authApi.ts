import { errHandler, service } from './api';

import type { AxiosResponse } from 'axios';
import type { UserData } from 'src/sharedTypes/UserData';
import type { PossibleResponses } from './api';

type GoogleResponse = {
  googleId: string;
  profileObj: {
    imageUrl: string;
    name: string;
  };
};

const authApi = {
  async googleLogin({
    googleId,
    profileObj,
  }: GoogleResponse): Promise<UserData> {
    try {
      const { data }: AxiosResponse<UserData> = await service.post(
        '/googlelogin',
        { googleId, profileObj }
      );

      localStorage.setItem('user', JSON.stringify(data));

      return await Promise.resolve(data);
    } catch (err: unknown) {
      errHandler(err as PossibleResponses);

      return Promise.resolve({});
    }
  },

  async isValidMongoId(id: string): Promise<boolean> {
    return service.post('/checkValidMongoId', { id });
  },

  async logout(): Promise<AxiosResponse> {
    localStorage.removeItem('user');

    return service.get('/logout');
  },
};

export type { GoogleResponse };
export default authApi;
