import React from 'react';
import styled from 'styled-components';

import colors from '@/tokens/definitions/color';

import type { JSX } from 'react';

const Container = styled.div`
  text-align: center;
  font-size: 2rem;
  ${colors.createGlow(colors.red)}
`;

const NoScores = (): JSX.Element => (
  <Container>
    <span>No Scores found 😢</span>
  </Container>
);

export default NoScores;
