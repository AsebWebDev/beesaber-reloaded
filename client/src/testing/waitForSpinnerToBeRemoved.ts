import { screen, waitForElementToBeRemoved } from '@testing-library/react';

const waitForSpinnerToBeRemoved = async () =>
  waitForElementToBeRemoved(() => screen.queryByTestId('loading-spinner'));

export default waitForSpinnerToBeRemoved;
