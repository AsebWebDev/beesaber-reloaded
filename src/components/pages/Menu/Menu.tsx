import { Link } from 'react-router-dom';
import styled from 'styled-components';

import BrandLogo from '@/components/common/BrandLogo/BrandLogo';
import GoogleOAuth from '@/components/common/GoogleOAuth/GoogleOAuth';
import NeonText from '@/components/common/NeonText/NeonText';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-family: 'NeonTubes2';
  padding: 1rem;
  height: 100%;
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

const Title = styled.div`
  display: flex;
  font-size: 1.5rem;
`;

const Menu = (): JSX.Element => (
  <Container>
    <MenuContainer>
      <MenuHeader>
        <Title>
          <NeonText glow as="h1" titleColor="red">
            Bee
          </NeonText>
          <NeonText glow as="h1" titleColor="blue">
            Saber
          </NeonText>
        </Title>
        <BrandLogo />
      </MenuHeader>
      <MenuItems>
        <MenuLink to="/">
          <NeonText glow as="h1" titleColor="red">
            Dashboard
          </NeonText>
        </MenuLink>
        <MenuLink to="/myprofile">
          <NeonText glow as="h1" titleColor="red">
            My
          </NeonText>
          <NeonText glow as="h1" titleColor="blue">
            Profile
          </NeonText>
        </MenuLink>
        <MenuLink to="/myhive">
          <NeonText glow as="h1" titleColor="red">
            My
          </NeonText>
          <NeonText glow as="h1" titleColor="blue">
            Hive
          </NeonText>
        </MenuLink>
      </MenuItems>
      <GoogleOAuth />
    </MenuContainer>
  </Container>
);

export default Menu;
