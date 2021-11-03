import styled from 'styled-components';

import Spinner from '@/components/common/Spinner/SpinnerPulse';
import { useAppSelector } from '@/store/hooks';
import { selectIsFetchingData } from '@/store/reducer/appStatusReducer';

import GoogleProfileData from './GoogleProfileData/GoogleProfileData';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 2rem;
`;

const Header = (): JSX.Element => {
  const isFetchingData = useAppSelector(selectIsFetchingData);

  return (
    <Container>
      <GoogleProfileData />
      {isFetchingData.status && <Spinner />}
    </Container>
  );
};

export default Header;
