import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { MDBTable, MDBTableBody, MDBTableHead } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';
import tokens from '@/tokens';

import OnePlayer from './OnePlayer/OnePlayer';

import type { PlayerInfo } from '@/../sharedTypes/ScoreSaberUserInfo';

const Container = styled.div`
  display: flex;
  align-items: center;
  min-width: 100%;
`;

const TableBody = styled(MDBTableBody)`
  color: ${tokens.color.white.main};
`;

const TableHead = styled(MDBTableHead)`
  color: ${tokens.color.yellow.main};
`;

type Props = {
  foundPlayers: PlayerInfo | PlayerInfo[] | null;
  handleSelect?: (playerInfo: PlayerInfo) => void;
};

function FoundPlayersList({
  foundPlayers,
  handleSelect,
}: Props): JSX.Element | null {
  if (foundPlayers === null) return null;
  // When input is not an array it is one single user --> parse to Array for mapping
  const players = Array.isArray(foundPlayers) ? foundPlayers : [foundPlayers];

  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId ?? skipToken);

  if (userData === undefined || players.length === 0) return null;

  return (
    <Container data-testid="found-players-list">
      <MDBTable>
        <TableHead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Rank</th>
            <th scope="col">Country</th>
            <th></th>
          </tr>
        </TableHead>
        <TableBody>
          {players.map((player) => {
            const isAlreadyAdded = userData.bees.some(
              (item) => item.playerId === player.playerId
            );

            return (
              <OnePlayer
                player={player}
                key={player.playerId}
                handleSelect={handleSelect}
                isAlreadyAdded={isAlreadyAdded}
                isOnlyResult={players.length === 1}
              />
            );
          })}
        </TableBody>
      </MDBTable>
    </Container>
  );
}

export default FoundPlayersList;
