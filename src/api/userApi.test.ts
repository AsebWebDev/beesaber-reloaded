import exampleSSUserInfo from '@/testing/testData/exampleSSUserInfo';
import exampleUserData from '@/testing/testData/exampleUserData';
import exampleUserScores from '@/testing/testData/exampleUserScores';

import api from './api';

import type { ScoreSaberUserInfo, UserData, UserScores } from '@/sharedTypes';

jest.mock('axios');
const fakeUserId = '12345';

describe('userapi', () => {
  describe('getUserData', () => {
    let spy:
      | jest.Mock
      | jest.SpyInstance<Promise<UserData | number>, [userId: string]>;

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

  describe('saveUserData', () => {
    let spy:
      | jest.Mock
      | jest.SpyInstance<
          Promise<UserData | string>,
          [userId: string, userdata: Partial<UserData>]
        >;

    beforeEach(() => {
      spy = jest.fn();
      spy = jest.spyOn(api.userApi, 'saveUserData');
    });

    afterEach(() => {
      spy.mockRestore();
      spy.mockReset();
    });

    it('return new UserData when saveUserData called', async () => {
      spy.mockResolvedValue(exampleUserData);
      const response = await api.userApi.saveUserData('123', exampleUserData);

      expect(response).toStrictEqual(exampleUserData);
    });
  });

  describe('getSSUserInfo', () => {
    let spy:
      | jest.Mock
      | jest.SpyInstance<Promise<ScoreSaberUserInfo>, [id: string]>;

    beforeEach(() => {
      spy = jest.fn();
      spy = jest.spyOn(api.userApi, 'getSSUserInfo');
    });

    afterEach(() => {
      spy.mockRestore();
      spy.mockReset();
    });

    it('return new SSUserInfo when getSSUserInfo called', async () => {
      spy.mockResolvedValue(exampleSSUserInfo);
      const response = await api.userApi.getSSUserInfo('123');

      expect(response).toStrictEqual(exampleSSUserInfo);
    });
  });

  describe('getRecentUserScores', () => {
    let spy: jest.Mock | jest.SpyInstance<Promise<UserScores>, [id: string]>;

    beforeEach(() => {
      spy = jest.fn();
      spy = jest.spyOn(api.userApi, 'getRecentUserScores');
    });

    afterEach(() => {
      spy.mockRestore();
      spy.mockReset();
    });

    it('return new SSUserInfo when getRecentUserScores called', async () => {
      spy.mockResolvedValue(exampleUserScores);
      const response = await api.userApi.getRecentUserScores('123');

      expect(response).toStrictEqual(exampleUserScores);
    });
  });
});
