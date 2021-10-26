import React from 'react';
import styled from 'styled-components';

import tokens from '../../../../tokens/index';

const yellow = tokens.color.yellow;

const Container = styled.div`
  font-family: 'NeonTubes2';
`;

const IStroke = styled.span`
  color: ${yellow.light};
  text-shadow: ${yellow.main} -2px -1px 5px, ${yellow.main} 2px 1px 5px,
    ${yellow.main} 0px 0px 10px, ${yellow.main} 0px 0px 15px,
    ${yellow.main} 0px 0px 20px, ${yellow.main} 0px 0px 30px;
`;

const BrandLogoI = (): JSX.Element => (
  <Container>
    <IStroke>I</IStroke>
  </Container>
);

export default BrandLogoI;
