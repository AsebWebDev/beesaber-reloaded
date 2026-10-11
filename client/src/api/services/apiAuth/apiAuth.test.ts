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
  });

  describe('isValidMongoId', () => {
    it('return true when id is valid', async () => {
      const response = await store.dispatch(
        apiAuth.endpoints.isValidMongoId.initiate('1234')
      );

      expect(response.data).toStrictEqual(true);
    });
  });
});
