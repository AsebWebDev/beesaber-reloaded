// import { useState } from 'react';
import styled from 'styled-components';

import NeonText from '../NeonText/NeonText';

import type { ColorStrings } from '@/tokens/definitions/color';
import type { ElementType } from '../NeonText/NeonText';

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  letter-spacing: 0.3rem;
`;

type Props = {
  as?: ElementType;
  children: string;
};

const Title = ({ children, as = 'h1' }: Props): JSX.Element => {
  const wordsArr = children.split(' ');
  const renderWords = (words: string[]) => {
    const colors: ColorStrings[] = ['red', 'blue'];

    return words.map((word, i) => (
      <NeonText
        key={word + i.toString()}
        glow
        as={as}
        titleColor={colors[i % 2]}
      >
        {word}
      </NeonText>
    ));
  };

  return <Container>{renderWords(wordsArr)}</Container>;
};

export default Title;
