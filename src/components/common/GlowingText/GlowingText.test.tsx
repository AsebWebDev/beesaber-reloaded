import { render } from '@testing-library/react';
import React from 'react';

import { allColorSetsArray } from '../../../tokens/definitions/color';
import GlowingText from './GlowingText';

describe('GlowingText', () => {
  it.each(allColorSetsArray)('should match the snapshot', (titleColor) => {
    const { container } = render(
      <GlowingText titleColor={titleColor}>Glowing Text</GlowingText>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
