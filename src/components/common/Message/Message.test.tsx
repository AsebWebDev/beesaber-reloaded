import { render } from '@testing-library/react';

import Message from './Message';

import type BadgeColor from '@/sharedTypes/BadgeColor';

describe('components/common/Message', () => {
  it.each(['danger', 'default', 'primary', 'secondary', 'success', 'warning'])(
    'should match snapshot, when type is %s',
    (type) => {
      const classToCheck = `alert-${type}`;
      const textContent = 'Putin sucks';
      const { container } = render(
        <Message text={textContent} type={type as BadgeColor} />
      );

      expect(container.firstChild).toHaveClass(classToCheck);
      expect(container.firstChild).toHaveTextContent(textContent);
    }
  );
});
