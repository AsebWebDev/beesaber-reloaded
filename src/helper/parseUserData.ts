import type { Score, ScoreData, UserScores } from '@/sharedTypes/UserScores';
import type { ScoreSaberUserInfo, UserData } from '../sharedTypes';

const parseUserData = (
  userData: UserData,
  scoreSaberData: ScoreSaberUserInfo,
  { scores: scoresRecent }: UserScores
): UserData => {
  const {
    playerInfo: { avatar: profilePic, playerName: username, rank },
    scoreStats,
  } = scoreSaberData;

  const scoresTop = [...scoresRecent].sort((a, b) => b.score - a.score); // sort descending
  const scoredSongsHashes = scoresRecent.map(
    (element: Score) => element.songHash
  );

  const parsedScoreData: ScoreData = {
    scoredSongsHashes,
    scoresRecent,
    scoresTop,
  };

  const parsedData = {
    ...userData,
    profilePic,
    rank,
    scoreData: parsedScoreData,
    scoreStats,
    username,
  };

  return parsedData;
};

export default parseUserData;
