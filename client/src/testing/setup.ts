import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import server from '@/mocks/server';

// jsdom has no layout, so it does not implement IntersectionObserver. The UI
// library asks for one; an observer that never reports anything is enough.
class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [];
  disconnect(): void {}
  observe(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(): void {}
}

globalThis.IntersectionObserver = IntersectionObserverStub;

// Every request a test makes has to be answered by a handler. A request
// without one is a mistake in the test and fails it.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  // Drop handlers a single test added with server.use()
  server.resetHandlers();
});

afterAll(() => server.close());
