import mongoose from 'mongoose';
import { Bee } from '../../sharedTypes/Bee';
import userSettings from '../configs/usersettings';

const Schema = mongoose.Schema;

interface User {
  username: string;
  password: string;
  googleId: string;
  googleImageUrl: string;
  googleName: string;
  profilePic: string;
  totalPlayCount: number;
  totalScore: number;
  county: string;
  rank: number;
  countryRank: number;
  isAdmin: boolean;
  settings: typeof userSettings;
  myIntersections: unknown[];
  myScoreSaberId: string;
  news: unknown[];
  playerInfo: {
    playerId: string;
  };
  scoreData: {
    lastSync: string; // lastSync currently not used
    scoresRecent: [];
    scoresTop: [];
    scoredSongsHashes: [];
  };
  bees: Bee[];
}

const userSchema = new Schema<User>(
  {
    username: String,
    password: String,
    googleId: String,
    googleImageUrl: String,
    googleName: String,
    profilePic: String,
    totalPlayCount: Number,
    totalScore: Number,
    county: String,
    rank: Number,
    countryRank: Number,
    isAdmin: {
      type: Boolean,
      default: false,
    },
    settings: userSettings,
    myIntersections: {
      type: Array,
      default: null,
    },
    myScoreSaberId: {
      type: String,
      default: '',
    },
    news: {
      type: Array,
      default: [],
    },
    playerInfo: {
      playerId: String,
    },
    scoreData: {
      lastSync: String, // lastSync currently not used
      scoresRecent: [],
      scoresTop: [],
      scoredSongsHashes: [],
    },
    bees: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const User = mongoose.model('User', userSchema);

export default User;
