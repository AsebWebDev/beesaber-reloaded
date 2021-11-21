import {
  parseAvatarUrl,
  parseFullPlayerQueryUrl,
  parseGetRecentScoresUrl,
  parseNewsTitle,
  parsePlayerByNameQueryUrl,
  parseSongPicUrl,
} from './urlParser';

const baseUrl = 'https://new.scoresaber.com';
const scoreSaberId = '123456';

describe('urlParser:', () => {
  describe('parseAvatarUrl', () => {
    it('should parse correct value', () => {
      const profilePicUrl = '/avatar/123456.jpg';
      const result = parseAvatarUrl(profilePicUrl);

      expect(result).toBe(baseUrl + profilePicUrl);
    });
  });

  describe('parseFullPlayerQueryUrl', () => {
    it('should parse correct value', () => {
      const result = parseFullPlayerQueryUrl(scoreSaberId);

      expect(result).toBe(`${baseUrl}/api/player/${scoreSaberId}/full`);
    });
  });

  describe('parseGetRecentScoresUrl', () => {
    it.each(['4', undefined])(
      'should parse correct value when count is %s',
      (count) => {
        const result = parseGetRecentScoresUrl(scoreSaberId, count);
        const expectedCount = count === undefined ? '1' : count;

        expect(result).toBe(
          `${baseUrl}/api/player/${scoreSaberId}/scores/recent/${expectedCount}`
        );
      }
    );
  });

  describe('parseNewsTitle', () => {
    it.each`
      type                 | title
      ${'ownNewScores'}    | ${'New Highscore'}
      ${'morePlayed'}      | ${'News songs played'}
      ${'beatScore'}       | ${'You got beaten, catch up!'}
      ${'someOtherString'} | ${'There is big news!'}
    `(
      'should parse correct value when type is $type',
      ({ type, title }: { title: string; type: string }) => {
        const result = parseNewsTitle(type);

        expect(result).toBe(title);
      }
    );
  });

  describe('parsePlayerByNameQueryUrl', () => {
    it('should parse correct value', () => {
      const playerName = 'DarthVader';
      const result = parsePlayerByNameQueryUrl(playerName);

      expect(result).toBe(`${baseUrl}/api/players/by-name/${playerName}`);
    });
  });

  describe('parseSongPicUrl', () => {
    it('should parse correct value', () => {
      const hash = 'jsakdfahj3klhjh3lhsdf999';
      const result = parseSongPicUrl(hash);

      expect(result).toBe(`${baseUrl}/api/static/covers/${hash}.png`);
    });
  });
});
