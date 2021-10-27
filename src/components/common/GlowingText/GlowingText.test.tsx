import { render } from '@testing-library/react';
import React from 'react';

import { colorStringsArray } from '../../../tokens/definitions/color';
import GlowingText from './GlowingText';

import type { ElementType } from './GlowingText';

describe('GlowingText', () => {
  it.each(colorStringsArray)(
    'should match the snapshot when titlecolor is %s',
    (titleColor) => {
      const { container } = render(
        <GlowingText titleColor={titleColor}>Glowing Text</GlowingText>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );

  it.each(['h1', 'h2', 'h2', 'p', 'span', undefined] as const)(
    'should match the snapshot when element is %s',
    (as: ElementType | undefined) => {
      const { container } = render(
        <GlowingText as={as} titleColor={'red'}>
          Glowing Text
        </GlowingText>
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
