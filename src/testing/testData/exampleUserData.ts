import type { UserData } from '@/sharedTypes/UserData';

const exampleUserData: UserData = {
  googleId: '123',
  googleImageUrl: 'https://some-image.url',
  googleName: 'Darth Vader',
  profilePic: 'url',
  username: 'lovenotwar',
  __v: 0,
  _id: '',
  bees: [],
  created_at: '',
  isAdmin: false,
  myIntersections: [],
  myScoreSaberId: '',
  news: [],
  scoreData: {
    scoredSongsHashes: [],
    scoresRecent: [],
    scoresTop: [],
  },
  settings: {
    Design: {
      boxShadow: {
        name: '',
        val: '',
      },
      theme: {
        name: '',
        val: '',
      },
    },
    Performance: {
      intervalUpdatecheck: {
        name: '',
        val: '',
      },
    },
  },
  updated_at: '',
};

export default exampleUserData;
