import { render } from '@testing-library/react';
import React from 'react';

import NeonButton from './NeonButton';

describe('NeonButton', () => {
  it('should match the snapshot', () => {
    const { container } = render(
      <NeonButton logo={'google'} text={'Button Text'} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
