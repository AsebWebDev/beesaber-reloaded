import axios from 'axios';

import verifyValidScoreSaberId from './verifyValidScoreSaberId';

jest.mock('axios');

describe('verifyValidScoreSaberId:', () => {
  const expectedErrorMessage =
    'ScoreSaber Id does not exist. Please check your id again...';
  const spyAxios = jest.spyOn(axios, 'get');

  it('should throw Error when api call fails', async () => {
    spyAxios.mockImplementationOnce(async () => Promise.reject());

    await expect(verifyValidScoreSaberId('123')).rejects.toThrow(
      expectedErrorMessage
    );
  });
});
