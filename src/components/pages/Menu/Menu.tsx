import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

// import { Link } from 'react-router-dom';
import { selectIsLoggedIn } from '../../../store/reducer/appStatusReducer';
import BrandLogo from '../../common/BrandLogo/BrandLogo';
import GoogleOAuth from '../../common/GoogleOAuth/GoogleOAuth';
import NeonText from '../../common/NeonText/NeonText';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'NeonTubes2';
  padding: 25px 20px;
`;

const Menu = (): JSX.Element => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  // eslint-disable-next-line no-console
  console.log('🚀 ~ file: Menu.tsx ~ line 12 ~ isLoggedIn', isLoggedIn);

  return (
    <Container>
      <BrandLogo />
      <div id="menu-main">
        <div id="menu-head">
          {/* <GoogleProfileData /> */}
          <NeonText glow as="h1" titleColor="red">
            Bee
          </NeonText>
          <br></br>
          <NeonText glow as="h1" titleColor="blue">
            Saber
          </NeonText>
          <GoogleOAuth />
        </div>
        {/* {isLoggedIn && (
          <div id="menu-points">
            <Link to="/">
              <span className="neon-red">Dashboard</span>
            </Link>
            <Link to="/myprofile">
              <span className="neon-red">My</span>{' '}
              <span className="neon-blue">Profile</span>
            </Link>
            <Link to="/myhive">
              <span className="neon-red">My</span>{' '}
              <span className="neon-blue">Hive</span>
            </Link>
          </div>
        )} */}
      </div>

      {/* alternative logo made with svg: */}
      {/* <svg className="logo"><use xlinkHref="#logo-honeycomb" /></svg> */}
    </Container>
  );
};

export default Menu;
