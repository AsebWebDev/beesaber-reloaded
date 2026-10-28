import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import type { Plugin } from 'vite';

/**
 * Turns the build into the demo's (`vite build --mode demo`): the page
 * starts client/src/demo/main.tsx instead of the app's entry, and the
 * output gets MSW's service worker, from the installed version of MSW, so
 * that the two always match. The icon and the manifest stay the app's,
 * which the server hands out next to the demo.
 */
const demoPlugin = (): Plugin => ({
  name: 'demo',
  apply: (_, { mode }) => mode === 'demo',
  // Before Vite reads the page for the scripts it has to build
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace('/src/main.tsx', '/src/demo/main.tsx'),
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'mockServiceWorker.js',
      source: readFileSync(
        createRequire(import.meta.url).resolve('msw/mockServiceWorker.js')
      ),
    });
  },
});

export { demoPlugin };
