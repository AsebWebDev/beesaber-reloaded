import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { createQueryClient } from '@/api/queryClient.ts';
import { routes } from '@/routes.tsx';

/**
 * Renders the whole app at a URL, the way main.tsx does, but with a router
 * that lives in memory and a fresh cache, so tests do not affect each other.
 */
const renderApp = (url = '/') => {
  // The app's own client, with one change: a failed request shows at once
  // instead of after three tries. Answers stay fresh as long as they do in
  // the app, so a list that is not refreshed after a change shows up as
  // stale here too, instead of being fetched again by every page.
  const queryClient = createQueryClient({ retry: false });
  const router = createMemoryRouter(routes, { initialEntries: [url] });

  return {
    queryClient,
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
