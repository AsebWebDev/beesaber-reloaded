import { MDBInput } from 'mdb-react-ui-kit';
import React from 'react';
import styled from 'styled-components';

import Title from '@/components/common/Title/Title';
import { useAppSelector } from '@/store/hooks';
import { selectUserName } from '@/store/reducer/userDataReducer';

const Header = styled.div`
  display: flex;
  flex-direction: column;
`;

type Props = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  query: string;
};

const ScoreHeader = ({ onChange, query }: Props): JSX.Element => {
  const username = useAppSelector(selectUserName);
  const title = username !== undefined ? username.toUpperCase() : 'MY SCORES';

  return (
    <Header>
      <Title as="h3">{title}</Title>
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
