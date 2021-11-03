import styled from 'styled-components';

import Spinner from '@/components/common/Spinner/SpinnerPulse';

import GoogleProfileData from './GoogleProfileData/GoogleProfileData';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 2rem;
`;

const Header = (): JSX.Element => (
  <Container>
    <GoogleProfileData />
    <Spinner />
  </Container>
);

export default Header;
