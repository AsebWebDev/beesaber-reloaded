import { render } from '@testing-library/react';

import NeonButton from './NeonButton';

describe('NeonButton', () => {
  it.each(['h1', 'h2', 'h2', 'p', 'span', undefined] as const)(
    'should match the snapshot',
    (as) => {
      const { container } = render(
        <NeonButton as={as} logo={'google'} text={'Button Text'} />
      );

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
