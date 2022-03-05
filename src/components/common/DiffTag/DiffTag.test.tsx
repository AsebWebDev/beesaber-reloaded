import { render } from '@testing-library/react';

import DiffTag from './DiffTag';

import type { Difficulty } from '@/../sharedTypes/UserScores';

describe('components/common/DiffTag', () => {
  it.each([1, 3, 5, 7, 9] as Difficulty[])(
    'should match snapshot when diffiultiy is %s',
    (difficulty) => {
      const { container } = render(<DiffTag difficulty={difficulty} />);

      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
