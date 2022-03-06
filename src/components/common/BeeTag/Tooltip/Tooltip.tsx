import Flag from 'react-country-flag';
import styled from 'styled-components';

import Avatar from '@/components/common/Avatar/Avatar';

import type { Bee } from '@/../sharedTypes';

const Container = styled.span`
  display: flex;
  flex-direction: column;
`;

type Props = {
  bee: Bee;
};

const Tooltip = ({ bee }: Props): JSX.Element => {
  const { avatar, playerName, rank, country } = bee;

  return (
    <Container>
      <Avatar avatar={avatar} playerName={playerName} />
      {playerName}
      <br />
      <Flag countryCode={country} />
      {rank}
      <br />
    </Container>
  );
};

export default Tooltip;
