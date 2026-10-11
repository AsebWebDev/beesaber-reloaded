/* eslint-disable import/no-unassigned-import */
import 'whatwg-fetch';
import '@testing-library/jest-dom';
import 'jest-styled-components';
import 'jest-useragent-mock';

// src/setupTests.js
import server from './src/mocks/server.js';

if (process.env.REACT_APP_MSW === 'enabled') {
  // Establish API mocking before all tests.
  beforeAll(() => server.listen());
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => server.resetHandlers());
  // Clean up after the tests are finished.
  afterAll(() => server.close());
}

export {};
