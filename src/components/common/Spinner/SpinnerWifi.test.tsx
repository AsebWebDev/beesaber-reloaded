import { render } from '@testing-library/react';

import SpinnerWifi from './SpinnerWifi';

describe('SpinnerWifi', () => {
  it('should match the snapshot', () => {
    const { container } = render(<SpinnerWifi />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
