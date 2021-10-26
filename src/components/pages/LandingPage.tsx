import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectIsLoggingIn } from '../../store/reducer/appStatusReducer';
import { mediaQuery } from '../../tokens/definitions/layout';
import tokens from '../../tokens/index';
import BrandLogo from '../common/BrandLogo/BrandLogo';
import GlowingText from '../common/GlowingText/GlowingText';
import GoolgeOAuth from '../common/GoogleOAuth/GoogleOAuth';

const { blue, red, yellow } = tokens.color;

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

const LandingPage = (): JSX.Element => {
  const isLoggingIn = useSelector(selectIsLoggingIn);
  const pleaseLoginText = 'Please login with your Google-Account';
  const loggingInText = 'Logging you in ... wait for it ... ';

  return (
    <Container>
      <BeeSaberTitle>
        <GlowingText titleColor={red}>Bee</GlowingText>
        <GlowingText titleColor={blue}>Saber</GlowingText>
      </BeeSaberTitle>
      <Content>
        <BrandLogo />
        <GlowingText as="h2" titleColor={yellow}>
          {!isLoggingIn ? pleaseLoginText : loggingInText}
        </GlowingText>
        {!isLoggingIn && <GoolgeOAuth />}
      </Content>
    </Container>
  );
};

export default LandingPage;
