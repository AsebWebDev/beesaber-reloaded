import { render } from '@testing-library/react';

import exampleBee from '@/testing/testData/exampleBee';

import Tooltip from './Tooltip';

describe('components/common/BeeTag/Tooltip', () => {
  it('should match snapshot', () => {
    const { container } = render(<Tooltip bee={exampleBee} />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
