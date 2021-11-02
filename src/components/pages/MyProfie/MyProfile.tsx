/* eslint-disable no-console */
import { MDBBtn, MDBIcon, MDBInput } from 'mdb-react-ui-kit';
import { useState } from 'react';
import styled from 'styled-components';

import Title from '@/components/common/Title/Title';

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

const MyProfile = (): JSX.Element => {
  const [myScoreSaberId, setMyScoreSaberId] = useState<string>('123');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMyScoreSaberId(e.target.value);

  const handleSave = () => {
    console.log('Handle Save');
  };

  return (
    <Container>
      <Title as="h1">My Profile</Title>
      <IdForm>
        <MDBInput
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
          value={myScoreSaberId}
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
