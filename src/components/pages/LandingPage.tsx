import React from 'react';
import styled from 'styled-components';

import { mediaQuery } from '../../tokens/definitions/layout';
import tokens from '../../tokens/index';
import BrandLogo from '../common/BrandLogo/BrandLogo';
import GlowingText from '../common/GlowingText/GlowingText';
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

const LandingPage = (): JSX.Element => (
  <Container>
    <BeeSaberTitle>
      <GlowingText titleColor={red}>Bee</GlowingText>
      <GlowingText titleColor={blue}>Saber</GlowingText>
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
