import React from 'react';
import styled from 'styled-components';

import colors, { allColorSetsObject } from '../../../tokens/definitions/color';

import type { ColorSet, ColorStrings } from '../../../tokens/definitions/color';

const Element = styled('span')<{ titleColor: ColorSet }>`
  ${({ titleColor }) => colors.createGlow(titleColor)}
`;

type ElementType = 'h1' | 'h2' | 'h2' | 'p' | 'span';

type Props = {
  as?: ElementType;
  children: React.ReactNode;
  titleColor: ColorStrings;
};

const GlowingText = ({
  as = 'span',
  children,
  titleColor,
}: Props): JSX.Element => (
  <Element as={as} titleColor={allColorSetsObject[titleColor]}>
    {children}
  </Element>
);

export type { ElementType };

export default GlowingText;
