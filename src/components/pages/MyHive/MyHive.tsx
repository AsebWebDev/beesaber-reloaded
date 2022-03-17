import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import {
  useGetUserDataQuery,
  useUpdateUserDataMutation,
} from '@/api/services/apiUser/apiUser';
import BeeTag from '@/components/common/BeeTag/BeeTag';
import NeonButtonBase from '@/components/common/NeonButton/NeonButton';
import ScoreBox from '@/components/common/ScoreBox/ScoreBox';
import Title from '@/components/common/Title/Title';
import parseId from '@/helper/parseEmptyStringToUndefined';
import { useAppSelector } from '@/store/hooks';
import { selectIsLoggedIn } from '@/store/reducer/appStatusReducer';
import { selectUserId } from '@/store/reducer/userDataReducer';

import AddBeeModal from './AddBeeModal/AddBeeModal';

import type { Bee } from '@/../sharedTypes';

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

const MyHiveBees = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0 7rem;
  flex-wrap: wrap;
  width: 100%;
`;

const MyHive = (): JSX.Element | null => {
  const history = useHistory();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(parseId(userId) ?? skipToken);
  const [updateUser] = useUpdateUserDataMutation();

  if (!isLoggedIn || userData === undefined || userId === undefined) {
    history.push('/'); // Redirect to the main page

    return null;
  }

  const { bees } = userData;
  const [modal, setModal] = useState(false);
  const [currentBee, setCurrentBee] = useState<Bee | undefined>(bees[0]);
  const beesExists = bees.length > 0;
  const toggleModal = () => setModal(!modal);
  const handleSelect = (bee: Bee) => setCurrentBee(bee);
  const handleDelete = (beeToDelete: Bee) => {
    const newBees = bees.filter(
      (bee: Bee) => bee.playerId !== beeToDelete.playerId
    );

    void toast.promise(
      updateUser({
        userId,
        userData: { bees: newBees },
      }),
      {
        pending: `Deleting ${beeToDelete.playerName}...`,
        success: `Your Bee ${beeToDelete.playerName} has been deleted. 👋`,
        error: `There has been an issue deleting ${beeToDelete.playerName} 🤯`,
      }
    );

    setCurrentBee(bees[0]);
  };

  return (
    <Container>
      <Title as="h1">MyHive</Title>
      <NeonButton text="Add a Bee" onClick={toggleModal} />
      <MyHiveBees>
        {bees.map((bee) => (
          <BeeTag
            key={bee.playerId}
            bee={bee}
            handleSelect={handleSelect}
            handleDelete={handleDelete}
            isSelected={currentBee?.playerId === bee.playerId}
          />
        ))}
        {!beesExists && <p>No bees yet</p>}
      </MyHiveBees>

      <div id="current-scores">
        {beesExists && currentBee !== undefined && (
          <ScoreBox scoreData={currentBee.scoreData} bee={currentBee} />
        )}
      </div>

      {/* // MODAL ADD BEES //  */}
      {modal && <AddBeeModal toggleModal={toggleModal} />}
    </Container>
  );
};

export default MyHive;
