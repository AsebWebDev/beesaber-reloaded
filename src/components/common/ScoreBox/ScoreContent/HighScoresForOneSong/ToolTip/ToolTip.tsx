import type { PlayedBy } from '@/../sharedTypes/UserScores';

type Props = {
  playedBy?: PlayedBy[];
};

const ToolTip = ({ playedBy }: Props) => (
  <ul>
    {playedBy?.map((bee) => {
      const { difficulty, playerId, playerName, myScore, beeScore } = bee;

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

export default ToolTip;
