import styled from 'styled-components';

import tokens from '@/tokens/index';

const Hr = styled.hr`
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 0;
  border-top: 1px solid ${tokens.color.white.light};
`;

function Divider(): JSX.Element {
  return <Hr />;
}

export default Divider;
