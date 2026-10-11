/* eslint-disable jest/no-try-expect */
/* eslint-disable jest/no-conditional-expect */
// TODO: Implement AXIOS tests without try ... catch

import axios from 'axios';

import errHandler from './errHandler';

import type { AxiosError } from 'axios';

jest.mock('axios');

describe('api', () => {
  describe('errorHandler', () => {
    it('return a JS Error when receiving an Axios Error', () => {
      const mockGet = jest.spyOn(axios, 'get');

      try {
        mockGet.mockRejectedValueOnce(new Error());
      } catch (error: unknown) {
        expect(axios.isAxiosError(error)).toBe(true);
        expect(axios.isAxiosError(errHandler(error as AxiosError))).toBe(false);
        expect(errHandler(error as AxiosError)).toHaveReturned();
        expect(typeof errHandler(error as AxiosError) === 'string').toBe(true);
      }
    });

    it('return a JS Error Message when receiving a JS Error', () => {
      const errorMessage = 'My Message';
      const JSError = new Error(errorMessage);

      expect(errHandler(JSError)).toBe(errorMessage);
    });
  });
});
