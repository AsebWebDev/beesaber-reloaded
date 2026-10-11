import { Link } from 'react-router-dom';
import styled from 'styled-components';

import BrandLogo from '@/components/common/BrandLogo/BrandLogo';
import GoogleOAuth from '@/components/common/GoogleOAuth/GoogleOAuth';
import Title from '@/components/common/Title/Title';
import Divider from '@/components/tools/Divider/Divider';
import parseId from '@/helper/parseEmptyStringToUndefined';
import useIsMobile from '@/sharedHooks/useIsMobile';
import useLoadingState from '@/sharedHooks/useLoadingState';
import { useAppSelector } from '@/store/hooks';
import { selectMyScoreSaberId } from '@/store/reducer/userDataReducer';
import { mediaQuery } from '@/tokens/definitions/layout';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-family: 'NeonTubes2';
  padding: 1rem 1rem 0 1rem;
  min-height: 100vh;

  ${mediaQuery.sm} {
    padding: 1rem;
    height: 100%;
  }
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  padding-bottom: 9rem;

  ${mediaQuery.sm} {
    padding-bottom: 3rem;
  }
`;

const MenuHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  margin-bottom: 3%;
`;

const MenuLink = styled(Link)`
  display: flex;
`;

const MenuItems = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
`;

const Menu = (): JSX.Element => {
  const { isMobile } = useIsMobile();
  const isLoading = useLoadingState();
  const myScoreSaberId = useAppSelector(selectMyScoreSaberId);

  return (
    <Container data-testid={'menu'}>
      <MenuContainer>
        <MenuHeader>
          <Title>Bee Saber</Title>
          <BrandLogo />
        </MenuHeader>
        <MenuItems>
          <MenuLink to="/">
            <Title>Dashboard</Title>
          </MenuLink>
          <MenuLink to="/myprofile">
            <Title>My Profile</Title>
          </MenuLink>
          {parseId(myScoreSaberId) !== undefined && !isLoading && (
            <MenuLink to="/myhive">
              <Title>My Hive</Title>
            </MenuLink>
          )}
        </MenuItems>
        <GoogleOAuth />
      </MenuContainer>
      {isMobile && <Divider />}
    </Container>
  );
};

export default Menu;
