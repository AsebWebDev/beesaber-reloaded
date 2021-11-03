import { render } from '@testing-library/react';

import ScrollDownIndicator from './ScrollDownIndicator';

describe('ScrollDownIndicator', () => {
  it('should match the snapshot', () => {
    const { container } = render(<ScrollDownIndicator />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
