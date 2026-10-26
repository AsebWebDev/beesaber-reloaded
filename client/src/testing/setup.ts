import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { i18n } from '@/i18n/i18n.ts';

import { fakeApi } from './fakeApi.ts';

// Every request a test makes has to be answered by the fake API. A request
// to anything else is a mistake in the test and fails it.
beforeAll(() => fakeApi.server.listen({ onUnhandledFrame: 'error' }));

// Every test starts in English, whatever the one before switched to. The
// tests look for texts as a person would, and those are the English ones.
beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  fakeApi.reset();
  // Answers a single test swapped in, and listeners it attached
  fakeApi.server.resetHandlers();
  fakeApi.server.events.removeAllListeners();
});

afterAll(() => fakeApi.server.close());
