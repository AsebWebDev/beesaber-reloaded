import { rest } from 'msw';

import store from '@/store/store';
import {
  exampleGooglePayLoad,
  exampleGoogleUserData,
} from '@/testing/testData/exampleGoogleData';

import apiAuth from './apiAuth';

describe('api/services/apiAuth/apiAuth.ts', () => {
  describe('googleLogin', () => {
    it('return userData when called', async () => {
      const response = await store.dispatch(
        apiAuth.endpoints.googleLogin.initiate(exampleGooglePayLoad)
      );

      expect(response).toStrictEqual({ data: exampleGoogleUserData });
    });

    // FIXME: mock error with MSW
    it.todo('return empty object when call failed');
  });
});
