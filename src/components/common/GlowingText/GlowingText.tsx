import React from 'react';
import styled from 'styled-components';

import colors, { allColorSetsObject } from '../../../tokens/definitions/color';

import type { ColorStrings } from '../../../tokens/definitions/color';

const Element = styled('span')<{ glow: boolean; titleColor: ColorStrings }>`
  ${({ titleColor, glow }) =>
    glow
      ? colors.createGlow(allColorSetsObject[titleColor])
      : `color: ${allColorSetsObject[titleColor].main}`}
  font-family: 'NeonTubes2';
  font-weight: 300;
`;

type ElementType = 'h1' | 'h2' | 'h2' | 'p' | 'span';

type Props = {
  as?: ElementType;
  children: React.ReactNode;
  glow?: boolean;
  titleColor: ColorStrings;
};

const GlowingText = ({
  as = 'span',
  children,
  glow = false,
  titleColor,
}: Props): JSX.Element => (
  <Element as={as} glow={glow} titleColor={titleColor}>
    {children}
  </Element>
);

export type { ElementType };

export default GlowingText;
