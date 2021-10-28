import React from 'react';

import NeonButton from '../../NeonButton/NeonButton';

import type { RenderPropsType } from '../authHandlers';

type Props = RenderPropsType & {
  text: string;
};

const NeonGoogleButton = ({ onClick, text }: Props): JSX.Element => (
  <span onClick={onClick}>
    <NeonButton text={text} logo="google" />
  </span>
);

export default NeonGoogleButton;
