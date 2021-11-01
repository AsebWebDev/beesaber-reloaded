import exampleUserData from '@/testing/testData/exampleUserData';

import api from './api';

import type { AxiosResponse } from 'axios';
import type { UserData } from '@/sharedTypes/UserData';

jest.mock('axios');
const fakeUserId = '12345';

describe('userapi', () => {
  describe('getUserData', () => {
    let spy:
      | jest.Mock
      | jest.SpyInstance<
          Promise<AxiosResponse | Error | UserData | number | string>,
          [userId: string]
        >;

    beforeEach(() => {
      spy = jest.fn();
      spy = jest.spyOn(api.userApi, 'getUserData');
    });

    afterEach(() => {
      spy.mockRestore();
      spy.mockReset();
    });

    it('return userData when getUserData called', async () => {
      spy.mockResolvedValue(exampleUserData);
      const response = await api.userApi.getUserData('123');

      expect(response).toStrictEqual(exampleUserData);
    });

    it('return 0 when userId is invalid mongo id', async () => {
      spy.mockResolvedValue(0);
      const response = await api.userApi.getUserData(fakeUserId);

      expect(response).toBe(0);
    });
  });
});
