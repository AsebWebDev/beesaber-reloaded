import styled from 'styled-components';

import ScoreBox from '@/components/common/ScoreBox/ScoreBox';
import Title from '@/components/common/Title/Title';
import useBuildScoreData from '@/sharedHooks/useBuildScoreData';
import { useAppSelector } from '@/store/hooks';
import { selectMyScoreSaberId } from '@/store/reducer/userDataReducer';

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
  const myScoreSaberId = useAppSelector(selectMyScoreSaberId);
  // FIXME: Remove 10 threshold
  const scoreData = useBuildScoreData(myScoreSaberId, 10);

  return (
    <Container>
      <Title as="h1">MyProfile</Title>
      <IdInput />
      {scoreData !== undefined && <ScoreBox scoreData={scoreData} />}
    </Container>
  );
};

export default MyProfile;
