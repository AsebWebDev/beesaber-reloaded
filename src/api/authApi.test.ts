import exampleUserData from '@/testing/testData/exampleUserData';

import api from './api';

import type { UserData } from '@/sharedTypes/UserData';
import type { GoogleResponse } from './authApi';

jest.mock('axios');

const googleResponse: GoogleResponse = {
  googleId: '123',
  profileObj: {
    imageUrl: 'url',
    name: 'Name',
  },
};

describe('authApi', () => {
  describe('googleLogin', () => {
    let spy: jest.Mock | jest.SpyInstance<Promise<UserData>, [GoogleResponse]>;

    beforeEach(() => {
      spy = jest.fn();
      spy = jest.spyOn(api.authApi, 'googleLogin');
    });

    afterEach(() => spy.mockRestore());

    it.todo('saved UserData to sessionStorage');

    it('return userData when called', async () => {
      spy.mockResolvedValue(exampleUserData);
      const response = await api.authApi.googleLogin(googleResponse);

      expect(response).toStrictEqual(exampleUserData);
    });

    it('return empty object when call failed', async () => {
      const response = await api.authApi.googleLogin(googleResponse);

      expect(response).toStrictEqual({});
    });
  });

  describe('isValidMongoId', () => {
    const spy = jest.spyOn(api.authApi, 'isValidMongoId');
    const childFunction = jest.fn(api.authApi.isValidMongoId.bind(this));
    const isValidMongoId = async (id: string) => childFunction(id);

    spy.mockResolvedValue(true);

    it('should call isValidMongoId fom auth api', async () => {
      await isValidMongoId('123');
      expect(childFunction).toHaveBeenCalledTimes(1);
      expect(childFunction).toHaveBeenCalledWith('123');
      expect(spy).toBeCalledTimes(1);
    });
  });

  it.todo('logout');
});
