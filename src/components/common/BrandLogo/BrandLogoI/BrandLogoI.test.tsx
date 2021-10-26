import { render } from '@testing-library/react';
import React from 'react';

import BrandLogoI from './BrandLogoI';

describe('BrandLogoI', () => {
  it('should match the snapshot', () => {
    const { container } = render(<BrandLogoI />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
