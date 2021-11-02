import { Link } from 'react-router-dom';
import styled from 'styled-components';

import BrandLogo from '@/components/common/BrandLogo/BrandLogo';
import GoogleOAuth from '@/components/common/GoogleOAuth/GoogleOAuth';
import Title from '@/components/common/Title/Title';
import Divider from '@/components/tools/Divider/Divider';
import useIsMobile from '@/sharedHooks/useIsMobile';
import { mediaQuery } from '@/tokens/definitions/layout';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-family: 'NeonTubes2';
  padding: 1rem 1rem 0 1rem;
  height: 100%;

  ${mediaQuery.sm} {
    padding: 1rem;
  }
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 3rem;
  justify-content: space-between;
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

  return (
    <Container>
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
          <MenuLink to="/myhive">
            <Title>My Hive</Title>
          </MenuLink>
        </MenuItems>
        <GoogleOAuth />
      </MenuContainer>
      {isMobile && <Divider />}
    </Container>
  );
};

export default Menu;
