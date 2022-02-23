import { screen, waitForElementToBeRemoved } from '@testing-library/react';

const waitForSpinnerToBeRemoved = async () =>
  waitForElementToBeRemoved(() => screen.getByTestId('loading-spinner'));

export default waitForSpinnerToBeRemoved;
