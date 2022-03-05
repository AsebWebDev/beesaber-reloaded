import { fireEvent, render, screen } from '@testing-library/react';

import exampleBee from '@/testing/testData/exampleBee';

import BeeTag from './BeeTag';

describe('component/common/BeeTag', () => {
  it.each([false, true])('should match snapshot', (isSelected) => {
    const { container } = render(
      <BeeTag
        bee={exampleBee}
        isSelected={isSelected}
        handleDelete={jest.fn()}
        handleSelect={jest.fn()}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should call handleSelect when bee is clicked', () => {
    const mockHandleSelect = jest.fn();

    render(
      <BeeTag
        bee={exampleBee}
        isSelected={false}
        handleDelete={jest.fn()}
        handleSelect={mockHandleSelect}
      />
    );

    const badge = screen.getByText(exampleBee.playerName);

    fireEvent.click(badge);

    expect(mockHandleSelect).toHaveBeenCalledTimes(1);
  });

  it('should call handleDelete when trash icon is clicked', () => {
    const mockHandleDelete = jest.fn();

    render(
      <BeeTag
        bee={exampleBee}
        isSelected={false}
        handleDelete={mockHandleDelete}
        handleSelect={jest.fn()}
      />
    );

    const trashIcon = screen.getByLabelText(`delete ${exampleBee.playerName}`);

    fireEvent.click(trashIcon);

    expect(mockHandleDelete).toHaveBeenCalledTimes(1);
  });
});
