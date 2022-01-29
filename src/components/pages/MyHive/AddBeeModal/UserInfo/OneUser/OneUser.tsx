import { MDBIcon } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import createLocalImageUrl from '@/helper/createLocalImageUrl';
import { parseAvatarUrl } from '@/helper/urlParser';

import type { PlayerInfo } from '@/sharedTypes/ScoreSaberUserInfo';

const Player = styled.div`
  display: flex;
`;

const Avatar = styled.img`
  margin-right: 1rem;
  max-width: 2rem;
`;

type Props = {
  handleSelect?: (user: PlayerInfo) => void;
  isAlreadyAdded: boolean;
  isOnlyResult: boolean;
  user: PlayerInfo;
};

function OneUser({
  handleSelect,
  isAlreadyAdded,
  isOnlyResult,
  user,
}: Props): JSX.Element | null {
  const { rank, country, playerId, playerName, avatar } = user;
  const url =
    avatar === '/images/steam.png' || avatar === '/images/oculus.png'
      ? createLocalImageUrl('bee.jpg')
      : parseAvatarUrl(avatar);

  return (
    <tr key={playerId}>
      <td>
        <Player>
          <Avatar src={url} alt={`Avatar of player ${playerName}`} />
          {playerName}
        </Player>
      </td>
      <td>{rank}</td>
      <td>{country}</td>
      <td>
        {handleSelect !== undefined && !isAlreadyAdded && (
          <MDBIcon
            onClick={() => handleSelect(user)}
            fas
            icon={isOnlyResult ? 'minus-circle' : 'plus-circle'}
          />
        )}
      </td>
    </tr>
  );
}

export default OneUser;
