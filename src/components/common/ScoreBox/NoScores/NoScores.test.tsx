import { render } from '@testing-library/react';

import NoScores from './NoScores';

describe('NoScores', () => {
  it('should match snapshot', () => {
    const { container } = render(<NoScores />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
