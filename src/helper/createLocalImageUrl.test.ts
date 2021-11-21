import createLocalImageUrl from './createLocalImageUrl';

describe('createLocalImageUrl:', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  const fileName = 'testfile.jpg';

  it.each([undefined, '/somepublicUrl'])(
    'should create correct filepath when process.env.PUBLIC_URL is %s',
    (PUBLIC_URL) => {
      process.env.PUBLIC_URL = PUBLIC_URL;
      const baseUrl = process.env.PUBLIC_URL ?? '/public';
      const result = createLocalImageUrl(fileName);

      expect(result).toBe(`${baseUrl}/imgs/${fileName}`);
    }
  );
});
