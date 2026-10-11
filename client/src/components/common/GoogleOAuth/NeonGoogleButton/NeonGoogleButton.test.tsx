import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NeonGoogleButton from './NeonGoogleButton';

describe('NeonGoogleButton', () => {
  it('should match the snapshot', () => {
    const { container } = render(
      <NeonGoogleButton onClick={jest.fn()} text={'someText'} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should call onClick when clicked', async () => {
    const callback = jest.fn();
    const someText = 'someText';

    render(<NeonGoogleButton onClick={callback} text={someText} />);

    const button = await screen.findByRole('button', { name: someText });

    userEvent.click(button);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
