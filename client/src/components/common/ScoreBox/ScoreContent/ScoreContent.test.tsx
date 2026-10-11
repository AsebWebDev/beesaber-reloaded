import { render } from '@testing-library/react';

import exampleScores from '@/testing/testData/exampleScores';

import ScoreContent from './ScoreContent';

describe('components/common/ScoreContent/', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should match snapshot', () => {
    const { container } = render(<ScoreContent scores={exampleScores} />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
