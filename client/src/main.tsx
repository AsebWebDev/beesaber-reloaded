import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { ApiError } from '@/api/client.ts';
import { routes } from '@/routes.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Asking again does not help when the server said "no" (4xx). Only
      // retry when something may have been temporarily broken.
      retry: (failures, error) =>
        !(error instanceof ApiError && error.status < 500) && failures < 2,
      staleTime: 30_000,
    },
  },
});

const container = document.getElementById('root');

if (container === null) throw new Error('Root element is missing');

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </QueryClientProvider>
  </StrictMode>
);
