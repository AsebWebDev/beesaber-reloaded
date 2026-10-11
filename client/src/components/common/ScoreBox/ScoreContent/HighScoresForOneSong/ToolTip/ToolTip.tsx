import type { PlayedBy } from '@beesaber/shared/UserScores';
import type { JSX } from 'react';

type Props = {
  playedBy?: PlayedBy[];
};

const ToolTip = ({ playedBy }: Props): JSX.Element => (
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
