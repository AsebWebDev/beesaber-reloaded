import { UserData } from '../../sharedTypes';
import calcAllScores from '../routes/helper/calcScores';
import updateAllScores from './updateAllScores';
import logger from 'node-color-log';

/**
 *
 * @param userData
 * @returns updated userData
 * This function checks all recent Score of a user and checks each song if it also played by
 * another player. If so, it marks this song as "playedByHive" and adds the other player to
 * the playedBy array of that song.
 *
 * If there is no ScoreData yet, the data will be fetched and return.
 *
 * The returned userData is updated with these information.
 */
const syncBeeScores = async (userData: UserData): Promise<UserData> => {
  const { bees, myScoreSaberId, scoreData } = userData;
  const scoreDataExists = scoreData.scoresRecent.length > 0;

  if (myScoreSaberId === '') return userData;

  const scoresToMap = scoreDataExists
    ? [...scoreData.scoresRecent]
    : (await updateAllScores(userData)).scoreData.scoresRecent;

  logger.info('Userdata exists and syncing...');
  const myUpdatedScores = scoresToMap.map((currentSong) => {
    // check all your bees for this specific song and return the song
    // with all bees in playedby which also played this song
    bees.map((currentBee) => {
      // check if the bee check has player your song
      const isMatch = currentBee.scoreData.scoredSongsHashes.includes(
        currentSong.songHash
      );

      // Returns the current song with extra playedBy data, if it is a match
      if (isMatch) {
        logger.info(
          `It is a match: ${currentSong.songName} played by ${currentBee.playerName}`
        );
        // find their score for this song
        const theirScore = currentBee.scoreData.scoresRecent.find(
          (song) => song.songHash === currentSong.songHash
        ).score;

        // create a new playedby array, if non exists
        if (currentSong.playedBy === undefined) currentSong.playedBy = [];

        // add the bee to the playbed by array of the current song
        currentSong.playedBy.push({
          beeScore: theirScore,
          myScore: currentSong.score,
          playerId: currentBee.playerId,
          playerName: currentBee.playerName,
        });
        currentSong.playedByHive = true;
        return currentSong;
      }
    });

    return currentSong;
  });

  const newScoreData = calcAllScores(myUpdatedScores);

  return { ...userData, scoreData: newScoreData };
};

export default syncBeeScores;
