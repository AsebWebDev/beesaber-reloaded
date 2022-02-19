import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import BrandLogo from '@/components/common/BrandLogo/BrandLogo';
import GoolgeOAuth from '@/components/common/GoogleOAuth/GoogleOAuth';
import NeonText from '@/components/common/NeonText/NeonText';
import { selectIsLoggingIn } from '@/store/reducer/appStatusReducer';
import { mediaQuery } from '@/tokens/definitions/layout';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  flex-wrap: none;
  width: 100%;
  font-size: 1.5rem;

  ${mediaQuery.md} {
    flex-direction: row;
  }

  ${mediaQuery.lg} {
    width: 90%;
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

const BeeSaberTitle = styled.div`
  text-align: center;

  ${mediaQuery.mobile} {
    margin-top: 3%;
    font-size: 3rem;
  }

  ${mediaQuery.sm} {
    margin-top: 12%;

    margin-bottom: 20px;
    font-size: 8rem;
  }

  ${mediaQuery.md} {
    margin-bottom: 20px;
    font-size: 10rem;
  }

  ${mediaQuery.lg} {
    margin-bottom: 1.25rem;
    font-size: 12rem;
  }
`;

const LandingPage = (): JSX.Element => {
  const isLoggingIn = useSelector(selectIsLoggingIn);
  const pleaseLoginText = 'Please login with your Google-Account:';
  const loggingInText = 'Logging you in... wait for it... ';

  return (
    <Container data-testid="landing-page">
      <BeeSaberTitle>
        <NeonText glow titleColor={'red'}>
          Bee
        </NeonText>
        <NeonText glow titleColor={'blue'}>
          Saber
        </NeonText>
      </BeeSaberTitle>
      <Content>
        <BrandLogo />
        <NeonText as="h2" titleColor={'yellow'}>
          {!isLoggingIn ? pleaseLoginText : loggingInText}
        </NeonText>
        <GoolgeOAuth />
      </Content>
    </Container>
  );
};

export default LandingPage;
