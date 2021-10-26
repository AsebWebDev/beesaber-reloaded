import React from 'react';
import styled from 'styled-components';

import colors from '../../../tokens/definitions/color';

import type { ColorSet } from '../../../tokens/definitions/color';

const Container = styled('span')<{ titleColor: ColorSet }>`
  ${({ titleColor }) => colors.createGlow(titleColor)}
`;

type Props = {
  children: React.ReactNode;
  titleColor: ColorSet;
};

const GlowingText = ({ children, titleColor }: Props): JSX.Element => (
  <Container titleColor={titleColor}>{children}</Container>
);

export default GlowingText;
