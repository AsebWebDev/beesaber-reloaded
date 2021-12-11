const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSettings = require('../configs/usersettings')

const userSchema = new Schema({
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
    default: false
  },
  settings: userSettings,
  myIntersections: {
    type: Array,
    default: null
  },
  myScoreSaberId: {
    type: String,
    default: ''
  },
  news: {
    type: Array,
    default: []
  },
  playerInfo: {
    playerId: String,
  },
  scoreData: {
    lastSync: String, // lastSync currently not used
    scoresRecent: [],
    scoresTop: [],
    scoredSongsHashes: []
  },
  bees: {
    type: Array,
    default: []
  }
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const User = mongoose.model('User', userSchema);

module.exports = User;
