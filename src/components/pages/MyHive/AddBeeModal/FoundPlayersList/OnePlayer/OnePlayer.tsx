import { MDBIcon } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import Avatar from '@/components/common/Avatar/Avatar';

import type { PlayerInfo } from '@/../sharedTypes/ScoreSaberUserInfo';

const Player = styled.div`
  display: flex;
`;

type Props = {
  handleSelect?: (user: PlayerInfo) => void;
  isAlreadyAdded: boolean;
  isOnlyResult: boolean;
  player: PlayerInfo;
};

function OnePlayer({
  handleSelect,
  isAlreadyAdded,
  isOnlyResult,
  player,
}: Props): JSX.Element | null {
  const { rank, country, playerId, playerName, avatar } = player;

  return (
    <tr key={playerId}>
      <td>
        <Player>
          <Avatar avatar={avatar} playerName={playerName} />
          {playerName}
        </Player>
      </td>
      <td>{rank}</td>
      <td>{country}</td>
      <td>
        {handleSelect !== undefined && !isAlreadyAdded && !isOnlyResult && (
          <MDBIcon
            data-testid="select-icon"
            onClick={() => handleSelect(player)}
            fas
            icon={'plus-circle'}
          />
        )}
      </td>
    </tr>
  );
}

export default OnePlayer;
