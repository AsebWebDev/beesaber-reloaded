import { UserData } from '../../sharedTypes';
import calcAllScores from '../routes/helper/calcScores';
import getAllScores from '../routes/helper/getAllScores';

/**
 *
 * @param userData
 * @returns updated userData
 * This function checks all recent Score of a user and checks each song if it also played by
 * another player. If so, it marks this song as "playedByHive" and adds the other player to
 * the playedBy array of that song.
 *
 * The returned userData is updated with these information.
 */
const syncBeeScores = async (userData: UserData): Promise<UserData> => {
  const { bees, myScoreSaberId, scoreData } = userData;
  if (myScoreSaberId === '') return userData;

  const scoreRecentCopy = [...scoreData.scoresRecent];

  if (scoreRecentCopy.length === 0) {
    console.log('No scoreData, fetching for the first time...');
    const newScoreData = await getAllScores(userData.myScoreSaberId);
    const newData = {
      ...userData,
      scoreData: newScoreData,
    };

    return Promise.resolve(newData);
  }

  console.log('Userdata exists and syncing...');
  const myUpdatedScores = scoreRecentCopy.map((currentSong) => {
    console.log('Checking ', currentSong.songName);

    // check all your bees for this specific song and return the song
    // with all bees in playedby which also played this song
    bees.map((currentBee) => {
      console.log('...for bee: ', currentBee.playerName);

      // check if the bee check has player your song
      const isMatch = currentBee.scoreData.scoredSongsHashes.includes(
        currentSong.songHash
      );

      // Returns the current song with extra playedBy data, if it is a match
      if (isMatch) {
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

  console.log(
    '🚀 ~ file: syncBeeScores.ts ~ line 64 ~ syncBeeScores ~ myUpdatedScores',
    myUpdatedScores
  );

  const newScoreData = calcAllScores(myUpdatedScores);
  console.log(
    '🚀 ~ file: syncBeeScores.ts ~ line 64 ~ syncBeeScores ~ newScoreData',
    newScoreData
  );

  console.log(userData);

  return { ...userData, scoreData: newScoreData };
};

export default syncBeeScores;
