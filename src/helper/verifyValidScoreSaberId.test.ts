import verifyValidScoreSaberId from './verifyValidScoreSaberId';

describe('verifyValidScoreSaberId:', () => {
  it.todo('should return true when id is valid');

  // FIXME: MSW seems to return an empty object, while the handler gets hit
  // and ctx.json from "getRecentScores" returns valid data
  // it('should return true when id is valid', async () => {
  //   const result = await verifyValidScoreSaberId('76561198037132296');

  //   expect(result).toBe(true);
  // });

  it.todo('should throw Error when api call fails');
});
