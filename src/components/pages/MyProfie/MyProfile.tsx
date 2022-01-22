import styled from 'styled-components';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import ScoreBox from '@/components/common/ScoreBox2/ScoreBox';
import Title from '@/components/common/Title/Title';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';

import IdInput from './IdInput/IdInput';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
`;

const MyProfile = (): JSX.Element => {
  const userId = useAppSelector(selectUserId);
  const { data: userDataResult } = useGetUserDataQuery(userId);
  const myScoreSaberId = userDataResult?.myScoreSaberId;

  return (
    <Container>
      <Title as="h1">MyProfile</Title>
      <IdInput />
      {myScoreSaberId !== undefined && <ScoreBox id={myScoreSaberId} />}
    </Container>
  );
};

export default MyProfile;
