/* eslint-disable no-console */
import { MDBContainer, MDBInput } from 'mdb-react-ui-kit';
import React, { useState } from 'react';
import styled from 'styled-components';

import Title from '@/components/common/Title/Title';
import { useAppSelector } from '@/store/hooks';
import { selectUserName } from '@/store/reducer/userDataReducer';

import type { ScoreData } from '@/sharedTypes';

const Header = styled.div`
  display: flex;
  flex-direction: column;
`;

type Props = {
  scoredata: ScoreData;
};

function ScoreOverview({ scoredata }: Props): JSX.Element | null {
  console.log('🚀 ~ scoredata', scoredata);
  const { scoresRecent } = scoredata;

  if (scoresRecent.length === 0) return null;

  const username = useAppSelector(selectUserName);
  const [query, setQuery] = useState('');
  const title = username !== undefined ? username.toUpperCase() : 'MY SCORES';

  return (
    <MDBContainer>
      <Header>
        <Title as="h3">{title}</Title>
        <MDBInput
          label="Filter Songs..."
          size="sm"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
        />
      </Header>
    </MDBContainer>
  );
}

export default ScoreOverview;
