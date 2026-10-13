import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { fakeApi } from './fakeApi.ts';

// Every request a test makes has to be answered by the fake API. A request
// to anything else is a mistake in the test and fails it.
beforeAll(() => fakeApi.server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  fakeApi.reset();
  // Answers a single test swapped in, and listeners it attached
  fakeApi.server.resetHandlers();
  fakeApi.server.events.removeAllListeners();
});

afterAll(() => fakeApi.server.close());
