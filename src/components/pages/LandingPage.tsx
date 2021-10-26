import React from 'react';
import styled from 'styled-components';

import { mediaQuery } from '../../tokens/definitions/layout';
import tokens from '../../tokens/index';
import BrandLogo from '../common/BrandLogo/BrandLogo';
import GoolgeOAuth from '../common/GoogleOAuth';

const { blue, red } = tokens.color;

const Content = styled.div`
  ${mediaQuery.mobile} {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  ${mediaQuery.lg} {
    width: 80%;
  }

  ${mediaQuery.xl} {
    display: flex;
    justify-content: center;
    width: 100%;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  font-family: 'NeonTubes2';

  ${mediaQuery.mobile} {
    font-size: 4rem;
  }
`;

const BeeSaberTitle = styled.h1`
  margin-top: 12%;
  text-align: center;

  ${mediaQuery.mobile} {
    font-size: 4rem;
  }

  ${mediaQuery.sm} {
    margin-bottom: 20px;
    font-size: 8rem;
  }

  ${mediaQuery.md} {
    margin-bottom: 20px;
    font-size: 10rem;
  }

  ${mediaQuery.lg} {
    margin-bottom: 20px;
    font-size: 12rem;
  }
`;

const BeeTitleRed = styled.span`
  color: ${red.light};
  text-shadow: ${red.main} -2px -1px 5px, ${red.main} 2px 1px 5px,
    ${red.main} 0px 0px 10px, ${red.main} 0px 0px 15px, ${red.main} 0px 0px 20px,
    ${red.main} 0px 0px 30px;
`;

const BeeTitleBlue = styled.span`
  color: ${blue.light};
  text-shadow: ${blue.main} -2px -1px 5px, ${blue.main} 2px 1px 5px,
    ${blue.main} 0px 0px 10px, ${blue.main} 0px 0px 15px,
    ${blue.main} 0px 0px 20px, ${blue.main} 0px 0px 30px;
`;

const LandingPage = (): JSX.Element => (
  <Container>
    <BeeSaberTitle>
      <BeeTitleRed>Bee</BeeTitleRed>
      <BeeTitleBlue>Saber</BeeTitleBlue>
    </BeeSaberTitle>
    <Content>
      <BrandLogo />
      <GoolgeOAuth />
      {/* {!loggingIn && (
        <h2 className="neon-yellow">Please login with your Google-Account</h2>
      )}
      {loggingIn && (
        <h2 className="neon-yellow">Logging you in ... wait for it ... </h2>
      )}
      {!loggingIn && (
          <GoolgeOAuth />
      )} */}
    </Content>
  </Container>
);

export default LandingPage;
