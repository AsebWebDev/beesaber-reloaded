import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import NeonButtonBase from '@/components/common/NeonButton/NeonButton';
import ScoreBox from '@/components/common/ScoreBox/ScoreBox';
import Title from '@/components/common/Title/Title';
import { useAppSelector } from '@/store/hooks';
import { selectIsLoggedIn } from '@/store/reducer/appStatusReducer';
import { selectUserId } from '@/store/reducer/userDataReducer';

import AddBeeModal from './AddBeeModal/AddBeeModal';

// import UserInfo from '../UserInfo';
import type { Bee } from '@/sharedTypes';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
`;

const NeonButton = styled(NeonButtonBase)`
  div:first-child {
    height: 50px;
    width: 200px;
    display: flex;
    align-items: center;
  }
`;

const MyHive = (): JSX.Element | null => {
  const history = useHistory();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId);

  if (!isLoggedIn || userData === undefined) {
    history.push('/'); // Redirect to the main page

    return null;
  }

  const { bees } = userData;
  const [modal, setModal] = useState(false);

  const [currentBee, setCurrentBee] = useState<Bee | null>(null);
  const beesExists = bees.length > 0;
  const toggleModal = () => setModal(!modal);
  const handleSelect = (bee: Bee) => setCurrentBee(bee);

  return (
    <Container>
      <Title as="h1">MyHive</Title>
      <NeonButton text="Add a Bee" onClick={toggleModal} />
      <div id="myhive-bees">
        {bees.map((bee, i) => (
          <div
            key={i}
            className="one-userinfo"
            onClick={() => handleSelect(bee)}
          >
            {/* <UserInfo key={i} playerInfoData={bee} /> */}
          </div>
        ))}
        {!beesExists && <p>No bees yet</p>}
      </div>

      <div id="current-scores">
        {currentBee !== null && (
          <ScoreBox scoreData={currentBee.scoreData} bee={currentBee} />
        )}
      </div>

      {/* // MODAL ADD beeS //  */}
      {modal && <AddBeeModal toggleModal={toggleModal} />}
    </Container>
  );
};

export default MyHive;
