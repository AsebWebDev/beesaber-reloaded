import { render } from '@testing-library/react';
import React from 'react';

import BrandLogo from './BrandLogo';

describe('BrandLogo', () => {
  it('should match the snapshot', () => {
    const { container } = render(<BrandLogo />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
