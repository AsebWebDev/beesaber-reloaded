import { render } from '@testing-library/react';

import SpinnerPulse from './SpinnerPulse';

describe('SpinnerPulse', () => {
  it.each([true, false])(
    'should match the snapshot when isBig is %s',
    (isBig) => {
      const { container } = render(<SpinnerPulse isBig={isBig} />);

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
