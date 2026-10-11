import { render } from '@testing-library/react';
import React from 'react';

import Divider from './Divider';

describe('Divider', () => {
  it('should match the snapshot', () => {
    const { container } = render(<Divider />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
