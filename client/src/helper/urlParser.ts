type UrlParser = (arg0: string, arg2?: string) => string;

const baseUrl = 'https://new.scoresaber.com';

const parseSongPicUrl: UrlParser = (hash) =>
  `${baseUrl}/api/static/covers/${hash}.png`;

const parseFullPlayerQueryUrl: UrlParser = (query) =>
  `${baseUrl}/api/player/${query}/full`;

const parsePlayerByNameQueryUrl: UrlParser = (query) =>
  `${baseUrl}/api/players/by-name/${query}`;

const parseGetRecentScoresUrl: UrlParser = (currentId, count = '1') =>
  `${baseUrl}/api/player/${currentId}/scores/recent/${count}`;

const parseAvatarUrl: UrlParser = (profilePicUrl) =>
  `${baseUrl + profilePicUrl}`;

const parseNewsTitle: UrlParser = (type) => {
  switch (type) {
    case 'ownNewScores':
      return 'New Highscore';
    case 'morePlayed':
      return 'News songs played';
    case 'beatScore':
      return 'You got beaten, catch up!';
    default:
      return 'There is big news!';
  }
};

export {
  parseAvatarUrl,
  parseFullPlayerQueryUrl,
  parseGetRecentScoresUrl,
  parseNewsTitle,
  parsePlayerByNameQueryUrl,
  parseSongPicUrl,
};
