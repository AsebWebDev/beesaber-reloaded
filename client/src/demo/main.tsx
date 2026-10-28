import '../index.css';
// Before anything renders: the texts in the visitor's language
import '@/i18n/i18n.ts';

import { QueryClientProvider } from '@tanstack/react-query';
import { setupWorker } from 'msw/browser';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { DEMO_API_PREFIX } from '@/api/base.ts';
import { createQueryClient } from '@/api/queryClient.ts';
import { routes } from '@/routes.tsx';

import { DemoBanner, DemoUnsupported } from './DemoBanner.tsx';
import { createDemoHandlers } from './handlers.ts';

/**
 * The demo: the whole app at /demo, with a made-up hive. A service worker
 * from MSW answers its requests in the browser (handlers.ts), so it needs
 * no account and no server, and cannot touch anyone's real data.
 *
 * Three things keep it away from the real API, each enough on its own:
 * - the service worker controls only pages under /demo, the scope of its
 *   own path, so the real app is never answered by it;
 * - the app asks for /demo-api/..., where the server has no route
 *   (src/api/base.ts), so a request the worker missed gets a 404;
 * - the server's Content-Security-Policy for /demo lets pages there
 *   connect to /demo-api only, so the browser refuses a request to the
 *   real API before it is sent, with or without a session cookie
 *   (server/src/http/frontend.ts).
 */

/**
 * Starts the service worker and says whether it answers for this page.
 * Some browsers have none here, like private windows of Firefox or
 * browsers built into other apps; others register it, but leave the page
 * to the network. Either way, the demo's requests would go to the server
 * and get its 404.
 */
const startWorker = async () => {
  try {
    await setupWorker(
      ...createDemoHandlers({ base: DEMO_API_PREFIX, signInUrl: '/demo/' })
        .handlers
    ).start({
      serviceWorker: {
        url: '/demo/mockServiceWorker.js',
        options: { scope: '/demo/' },
      },
      // Files and pictures go to the server as usual. So would a request to
      // the demo's API that no handler answers: the server has nothing there
      // and answers 404.
      onUnhandledFrame: 'bypass',
      quiet: true,
    });
  } catch {
    return false;
  }

  return navigator.serviceWorker.controller !== null;
};

const container = document.getElementById('root');

if (container === null) throw new Error('Root element is missing');

const root = createRoot(container);

if (await startWorker()) {
  const queryClient = createQueryClient();

  root.render(
    <StrictMode>
      <DemoBanner />
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={createBrowserRouter(routes, { basename: '/demo' })}
        />
      </QueryClientProvider>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <DemoBanner />
      <DemoUnsupported />
    </StrictMode>
  );
}
