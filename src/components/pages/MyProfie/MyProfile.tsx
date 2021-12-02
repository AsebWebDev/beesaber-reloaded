import { MDBBtn, MDBIcon, MDBInput } from 'mdb-react-ui-kit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import api, { errHandler } from '@/api/api';
import ScoreBox from '@/components/common/ScoreBox/ScoreBox';
import Title from '@/components/common/Title/Title';
import verifyValidScoreSaberId from '@/helper/verifyValidScoreSaberId';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userIsFetchingData } from '@/store/reducer/appStatusReducer';
import {
  selectMyScoreData,
  selectMyScoreSaberId,
  selectUserId,
  userDataUpdated,
} from '@/store/reducer/userDataReducer';

import type { ChangeEvent } from 'react';
import type { PossibleResponses } from '@/api/api';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
`;

const IdForm = styled.form`
  display: flex;
  align-items: center;
`;

const MyProfile = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const scoreData = useAppSelector(selectMyScoreData);
  const userId = useAppSelector(selectUserId);
  const selectedScoreSaberId = useAppSelector(selectMyScoreSaberId);
  const [myScoreSaberId, setMyScoreSaberId] = useState<string>(
    selectedScoreSaberId !== undefined ? selectedScoreSaberId : ''
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setMyScoreSaberId(e.target.value);

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const userData = { myScoreSaberId };

    dispatch(userIsFetchingData({ status: true, statusText: 'Saving ID...' }));
    try {
      await verifyValidScoreSaberId(myScoreSaberId);
      const updatedUserData = await api.userApi.saveUserData(userId, userData);

      dispatch(userDataUpdated(updatedUserData));
      toast.success('ID successfully saved');
    } catch (err: unknown) {
      errHandler(err as PossibleResponses);
    }
    dispatch(userIsFetchingData({ status: false }));
  };

  return (
    <Container>
      <Title as="h1">MyProfile</Title>
      <IdForm>
        <MDBInput
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
          label="Your ScoreSaber ID"
          icon="user"
          group="true"
          type="text"
          validate="true"
          error="wrong"
          success="right"
          value={myScoreSaberId}
        />
        <MDBBtn
          onClick={handleSave}
          size="sm"
          disabled={myScoreSaberId === selectedScoreSaberId}
          outline
          color="secondary"
        >
          Save
          <MDBIcon far icon="paper-plane" className="ml-1" />
        </MDBBtn>
      </IdForm>
      {scoreData !== undefined && <ScoreBox scoreData={scoreData} />}
    </Container>
  );
};

export default MyProfile;
