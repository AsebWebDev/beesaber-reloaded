import logger from 'node-color-log';
import { Bee, UserData } from '../../sharedTypes';
import calcAllScores from '../routes/helper/calcScores';

const syncBeeScores = (userdata: UserData): Bee[] => {
  const { bees, scoreData: myScores } = userdata;

  const updatedBees = bees.map((currentBee) => {
    const { scoreData: beeScoreData } = currentBee;

    const newBeeRecentScores = beeScoreData.scoresRecent.map((currentSong) => {
      const matchingScore = myScores.scoresRecent.find(
        (song) =>
          song.songHash === currentSong.songHash &&
          song.difficulty === currentSong.difficulty
      );

      // Returns the current song with extra playedBy data, if it is a match
      if (matchingScore) {
        // create a new playedby array, if non exists
        if (currentSong.playedBy === undefined) currentSong.playedBy = [];

        const songAlreadyAdded = currentSong.playedBy.some(
          (e) => e.playerId === userdata.playerInfo.playerId
        );

        const beeScore = currentSong.score;
        const myScore = matchingScore.score;
        const { songName } = currentSong;
        const { playerName } = currentBee;

        // add the bee to the playbed by array of the current song
        if (!songAlreadyAdded) {
          logger.info(
            `New song synced: ${songName}, played by me and my bee ${playerName} (Me: ${myScore} / Bee: ${beeScore})`
          );
          currentSong.playedBy.push({
            beeScore,
            difficulty: currentSong.difficulty,
            myScore,
            playerId: userdata.myScoreSaberId,
            playerName: userdata.playerInfo.playerName,
          });
          currentSong.playedByHive = true;
        }
      }
      return currentSong;
    });

    return {
      ...currentBee,
      scoreData: calcAllScores(newBeeRecentScores),
    };
  });

  return updatedBees;
};

export default syncBeeScores;
