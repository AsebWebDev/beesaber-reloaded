import { render } from '@testing-library/react';

import * as useIsScrollingDown from '@/sharedHooks/useIsScrollingDown';

import ScrollDownIndicator from './ScrollDownIndicator';

describe('ScrollDownIndicator', () => {
  const spy = jest.spyOn(useIsScrollingDown, 'default');

  afterAll(() => {
    spy.mockReset();
  });

  it('should match the snapshot', () => {
    const { container } = render(<ScrollDownIndicator />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should return null when scrollig down', () => {
    spy.mockReturnValue({ isScrollingDown: true });

    const { container } = render(<ScrollDownIndicator />);

    expect(container.firstChild).toBeNull();
  });
});
