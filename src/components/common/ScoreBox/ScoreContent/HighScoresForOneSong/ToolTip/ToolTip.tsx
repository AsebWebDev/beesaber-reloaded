import type { PlayedBy } from '@/../sharedTypes/UserScores';

type Props = {
  playedBy?: PlayedBy[];
};

const ToolTip = ({ playedBy }: Props) => {
  console.log('🚀 ~ file: ToolTip.tsx ~ line 8 ~ playedBy', playedBy);

  return (
    <ul>
      {playedBy?.map((bee) => {
        const { playerId, playerName, myScore, beeScore } = bee;
        const difficulty = bee.difficulty.toString();

        return (
          <li key={`${playerId}-${difficulty}`}>
            <p>{playerName}</p>
            <p>{myScore}</p>
            <p>{beeScore}</p>
            <p>{difficulty}</p>
          </li>
        );
      })}
    </ul>
  );
};

export default ToolTip;
