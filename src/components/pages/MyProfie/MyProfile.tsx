/* eslint-disable no-console */
import { MDBBtn, MDBIcon, MDBInput } from 'mdb-react-ui-kit';
import { useState } from 'react';
import styled from 'styled-components';

import Title from '@/components/common/Title/Title';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userIsFetchingData } from '@/store/reducer/appStatusReducer';
import { selectMyScoreSaberId } from '@/store/reducer/userDataReducer';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const IdForm = styled.form`
  display: flex;
  align-items: center;
`;

const MyProfile = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const id = useAppSelector(selectMyScoreSaberId);
  const [myScoreSaberId, setMyScoreSaberId] = useState(id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMyScoreSaberId(e.target.value);

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log(myScoreSaberId);
    dispatch(userIsFetchingData({ status: true, statusText: 'Saving ID...' }));
    // await api.getScoreSaberUserInfo(myScoreSaberId, 'id')
    //     .then(async scoreSaberUserInfo => {
    //         const userdata = { ...props.userdata, ...scoreSaberUserInfo, myScoreSaberId }
    //         await api.saveUserData(props.userdata._id, userdata)
    //         dispatch({ type: "UPDATE_USER_DATA", userdata })
    //         await api.getlatestScore(userdata.myScoreSaberId)
    //     })
    //     .catch((err) => console.log(err))
    dispatch(userIsFetchingData({ status: false }));
  };

  return (
    <Container>
      <Title as="h1">My Profile</Title>
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
        />
        <MDBBtn onClick={handleSave} size="sm" outline color="secondary">
          Save
          <MDBIcon far icon="paper-plane" className="ml-1" />
        </MDBBtn>
      </IdForm>
    </Container>
  );
};

export default MyProfile;
