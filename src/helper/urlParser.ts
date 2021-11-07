type UrlParser = (arg0: string, arg2?: string) => string;

const parseSongPicUrl: UrlParser = (hash) =>
  `https://new.scoresaber.com/api/static/covers/${hash}.png`;

const parseFullPlayerQueryUrl: UrlParser = (query) =>
  `https://new.scoresaber.com/api/player/${query}/full`;

const parsePlayerByNameQueryUrl: UrlParser = (query) =>
  `https://new.scoresaber.com/api/players/by-name/${query}`;

const parseGetRecentScoresUrl: UrlParser = (currentId, count = '1') =>
  `https://new.scoresaber.com/api/player/${currentId}/scores/recent/${count}`;

const parseAvatarUrl: UrlParser = (playerId) =>
  `https://new.scoresaber.com/api/static/avatars/${playerId}.jpg`;

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
