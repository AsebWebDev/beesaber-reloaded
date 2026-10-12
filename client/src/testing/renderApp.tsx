import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { routes } from '@/routes.tsx';

/**
 * Renders the whole app at a URL, the way main.tsx does, but with a router
 * that lives in memory and a fresh cache, so tests do not affect each other.
 */
const renderApp = (url = '/') => {
  const queryClient = new QueryClient({
    // A failed request should fail the test at once, not after three tries
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [url] });

  return {
    router,
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    ),
  };
};

export { renderApp };
