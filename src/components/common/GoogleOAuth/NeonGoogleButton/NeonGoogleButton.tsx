import React from 'react';

import NeonButton from '@/components/common/NeonButton/NeonButton';

import type { ElementType } from '@/components/common/NeonText/NeonText';
import type { RenderPropsType } from '../authHandlers';

type Props = RenderPropsType & {
  as?: ElementType;
  text: string;
};

const NeonGoogleButton = ({ as = 'h1', onClick, text }: Props): JSX.Element => (
  <span onClick={onClick}>
    <NeonButton as={as} text={text} logo="google" />
  </span>
);

export default NeonGoogleButton;
