import { ScoreData, UserData } from '../../sharedTypes';
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
const syncMyScoreData = async (userData: UserData): Promise<ScoreData> => {
  const { bees, myScoreSaberId, scoreData } = userData;
  const scoreDataExists = scoreData.scoresRecent.length > 0;

  if (myScoreSaberId === '') return scoreData;

  const scoresToMap = scoreDataExists
    ? [...scoreData.scoresRecent]
    : (await updateAllScores(userData)).scoreData.scoresRecent;

  const myUpdatedScores = scoresToMap.map((currentSong) => {
    // check all your bees for this specific song and return the song
    // with all bees in playedby which also played this song
    bees.map((currentBee) => {
      const { playerName, playerId } = currentBee;

      const matchingScore = currentBee.scoreData.scoresRecent.find(
        (song) =>
          song.songHash === currentSong.songHash &&
          song.difficulty === currentSong.difficulty
      );

      // Returns the current song with extra playedBy data, if it is a match
      if (matchingScore) {
        // create a new playedby array, if non exists
        if (currentSong.playedBy === undefined) currentSong.playedBy = [];

        const songAlreadyAdded = currentSong.playedBy.some(
          (e) => e.playerId === playerId
        );

        const beeScore = matchingScore.score;
        const myScore = currentSong.score;
        const { songName } = currentSong;

        // add the bee to the playbed by array of the current song
        if (!songAlreadyAdded) {
          logger.info(
            `New song synced: ${songName}, played by me and my bee ${playerName} (Me: ${myScore} / Bee: ${beeScore})`
          );
          currentSong.playedBy.push({
            beeScore,
            difficulty: currentSong.difficulty,
            myScore,
            playerId,
            playerName,
          });
          currentSong.playedByHive = true;
        }
      }
    });

    return currentSong;
  });

  return calcAllScores(myUpdatedScores);
};

export default syncMyScoreData;
