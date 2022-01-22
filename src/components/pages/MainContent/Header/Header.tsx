import styled from 'styled-components';

import Spinner from '@/components/common/Spinner/SpinnerPulse';
import useLoadingState from '@/sharedHooks/useLoadingState';

import GoogleProfileData from './GoogleProfileData/GoogleProfileData';

const Container = styled.div`
  display: flex;
  align-items: center;
  padding-right: 2rem;
`;

const Header = (): JSX.Element => {
  const showSpinner = useLoadingState();

  return (
    <Container>
      <GoogleProfileData />
      {showSpinner && <Spinner />}
    </Container>
  );
};

export default Header;
