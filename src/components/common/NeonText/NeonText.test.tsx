import { render } from '@testing-library/react';
import React from 'react';

import { colorStringsArray } from '../../../tokens/definitions/color';
import NeonText from './NeonText';

import type { ElementType } from './NeonText';

describe('NeonText', () => {
  it.each(colorStringsArray)(
    'should match the snapshot when titlecolor is %s',
    (titleColor) => {
      const { container } = render(
        <NeonText glow titleColor={titleColor}>
          Glowing Text
        </NeonText>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it.each(['h1', 'h2', 'h2', 'p', 'span', undefined] as const)(
    'should match the snapshot when element is %s',
    (as: ElementType | undefined) => {
      const { container } = render(
        <NeonText glow as={as} titleColor={'red'}>
          Glowing Text
        </NeonText>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
