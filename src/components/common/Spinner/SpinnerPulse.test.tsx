import { render } from '@testing-library/react';

import SpinnerPulse from './SpinnerPulse';

describe('SpinnerPulse', () => {
  it('should match the snapshot', () => {
    const { container } = render(<SpinnerPulse />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
