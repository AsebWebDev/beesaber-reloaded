import { MDBInput } from 'mdb-react-ui-kit';
import React from 'react';
import styled from 'styled-components';

import Title from '@/components/common/Title/Title';
import { useAppSelector } from '@/store/hooks';
import { selectUserName } from '@/store/reducer/userDataReducer';
import tokens from '@/tokens';

import type { Bee } from '@/../sharedTypes';

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  margin: 0;
  color: ${tokens.color.blue.light};
  label {
    color: ${tokens.color.white.light}!important;
  }
`;

type Props = {
  bee?: Bee;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  query: string;
};

const ScoreHeader = ({ bee, onChange, query }: Props): JSX.Element => {
  const username = useAppSelector(selectUserName);
  const title = username !== undefined ? username.toUpperCase() : 'MY SCORES';

  return (
    <Header>
      <Title as="h3">{bee !== undefined ? bee.playerName : title}</Title>
      <MDBInput
        label="Filter Songs..."
        size="sm"
        value={query}
        onChange={onChange}
      />
    </Header>
  );
};

export default ScoreHeader;
