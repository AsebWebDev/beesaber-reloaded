import { MDBTable, MDBTableBody, MDBTableHead } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';
import tokens from '@/tokens';

import OneUser from './OneUser/OneUser';

import type { PlayerInfo } from '@/sharedTypes/ScoreSaberUserInfo';

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
  foundUsers: PlayerInfo[] | null;
  handleChose?: (userInfoData: PlayerInfo) => void;
};

function UserInfo({ foundUsers, handleChose }: Props): JSX.Element | null {
  if (foundUsers === null) return null;
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId);

  if (userData === undefined) return null;

  return (
    <Container>
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
          {foundUsers.map((user) => {
            const isAlreadyAdded = userData.bees.some(
              (item) => item.playerId === user.playerId
            );

            return (
              <OneUser
                user={user}
                key={user.playerId}
                handleChose={handleChose}
                isAlreadyAdded={isAlreadyAdded || foundUsers.length === 1}
              />
            );
          })}
        </TableBody>
      </MDBTable>
    </Container>
  );
}

export default UserInfo;
