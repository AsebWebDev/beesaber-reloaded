import { render } from '@testing-library/react';
import React from 'react';

import Title from './Title';

describe('Title', () => {
  it.each(['h1', 'h2', 'h3', 'p', 'span', undefined] as const)(
    'should match the snapshot when element is %s',
    (as) => {
      const { container } = render(<Title as={as}>Glowing Text</Title>);

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
