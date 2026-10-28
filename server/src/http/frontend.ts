import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { MiddlewareHandler } from 'hono';

/** Anything that answers requests, like the API from createApp */
type Api = {
  fetch: (request: Request, env?: unknown) => Promise<Response> | Response;
};

/**
 * Sets a Cache-Control header on successful answers that pass the test.
 * Runs after the file was found, so a 404 is never cached.
 */
const cacheFor = (
  value: string,
  applies: (response: Response) => boolean = () => true
): MiddlewareHandler =>
  async function cache(c, next) {
    await next();

    if (c.res.ok && applies(c.res)) c.res.headers.set('Cache-Control', value);
  };

/**
 * What a page of the app may load, and from where. If someone manages to
 * smuggle markup into a page, say through a player name, the browser still
 * refuses to run a script that is not one of our own files.
 *
 * The built frontend has no inline scripts or style blocks. Pictures of
 * players and songs come from ScoreSaber's CDN. React sets a few style
 * attributes, like the width of a bar; style attributes cannot run code, so
 * they are allowed while style blocks are not.
 */
const CONTENT_SECURITY_POLICY = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  styleSrcAttr: ["'unsafe-inline'"],
  imgSrc: ["'self'", 'https://cdn.scoresaber.com'],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  // No other site may show the app in a frame, where a visitor could be
  // tricked into clicking on it unseen
  frameAncestors: ["'none'"],
};

/** A path whose last part has a dot, like /assets/index-1a2b.js */
const looksLikeFile = (path: string) => /\.[^/]*$/.test(path);

/** Where the demo's API lives in the browser; the server has nothing there */
const DEMO_API_PREFIX = '/demo-api';

/**
 * A built frontend in `root`, at `prefix`: its files, cached as fits, and
 * index.html for every other address, so React can draw the page it asks
 * for.
 */
const site = (
  root: string,
  prefix: string,
  policies: {
    page: typeof CONTENT_SECURITY_POLICY;
    worker?: typeof CONTENT_SECURITY_POLICY;
  }
) => {
  // The files of the demo lie in their own folder, without its name
  const inRoot = (path: string) => path.slice(prefix.length);
  const forPages = secureHeaders({ contentSecurityPolicy: policies.page });
  const forWorker = secureHeaders({
    contentSecurityPolicy: policies.worker ?? policies.page,
  });

  return (
    new Hono()
      // A service worker gets the policy of its own script, which also
      // governs what it may fetch
      .use((c, next) =>
        c.req.path.endsWith('/mockServiceWorker.js')
          ? forWorker(c, next)
          : forPages(c, next)
      )
      // The names of the built files contain a hash of their content, so a
      // changed file gets a new name. A browser can keep these for good.
      .use('/assets/*', cacheFor('public, max-age=31536000, immutable'))
      // The page itself has to be asked for again on every visit, or a
      // browser would keep loading the files of an old version
      .use(
        cacheFor('no-cache', (response) =>
          (response.headers.get('content-type') ?? '').startsWith('text/html')
        )
      )
      // The demo's service worker keeps its name, so a browser has to ask
      // for it again too, or it would keep answering for an old demo
      .use('/mockServiceWorker.js', cacheFor('no-cache'))

      // The build puts a Brotli and a gzip copy next to every text file
      // (client/plugins/precompress.ts). A browser that understands one of
      // them gets it, a third of the size; the others get the file as it is.
      .use(
        serveStatic({ root, precompressed: true, rewriteRequestPath: inRoot })
      )
      // A file that does not exist is not a page. Answering with the page
      // would hand the browser HTML where it expects a script or a picture.
      .get('*', (c, next) =>
        looksLikeFile(c.req.path) ? c.notFound() : next()
      )
      // Every other address is a page of the app, like /hive/123. The
      // browser gets index.html, which loads React, and React draws the page
      // the address asks for.
      .get('*', serveStatic({ root, path: 'index.html', precompressed: true }))
  );
};

/**
 * The whole app behind one address: requests under /api go to the API,
 * every other request gets the built frontend (`pnpm build` puts it into
 * client/dist).
 *
 * One address for both is what the rest of the app relies on. The session
 * cookie is only sent along to the site that set it, and the API sends no
 * CORS headers, so a frontend on another address could not use it.
 *
 * The build also holds the demo, in client/dist/demo, served at /demo. Its
 * pages answer their requests in the browser and must never reach the
 * real API, where a visitor of the real app has a session cookie. So
 * /demo-api, where the demo sends them, answers 404 here, and the demo's
 * pages may connect to /demo-api and nothing else: the browser refuses a
 * request from them to /api before it is sent. See client/src/demo/main.tsx.
 */
const withFrontend = (
  api: Api,
  root: string,
  { appUrl }: { appUrl: string }
) => {
  if (!existsSync(join(root, 'index.html')))
    throw new Error(
      `No built frontend in ${root}: index.html is missing. Run "pnpm build" first.`
    );

  const demo = join(root, 'demo');
  const hasDemo = existsSync(join(demo, 'index.html'));

  return (
    new Hono()
      // The API answers for itself, its errors and "not found" included.
      // `env` carries the connection, which the rate limit reads the
      // caller's address from.
      .all('/api/*', (c) => api.fetch(c.req.raw, c.env))
      .all(`${DEMO_API_PREFIX}/*`, (c) => c.notFound())

      // The demo's service worker controls the pages under /demo/ only, the
      // folder it lives in; /demo itself is outside of it
      .get('/demo', (c) => (hasDemo ? c.redirect('/demo/', 301) : c.notFound()))
      .route(
        '/demo',
        hasDemo
          ? site(demo, '/demo', {
              page: {
                ...CONTENT_SECURITY_POLICY,
                connectSrc: [`${appUrl}${DEMO_API_PREFIX}/`],
              },
              // The worker answers the demo's requests and hands the rest,
              // the demo's own files and pictures, to the server. It may
              // fetch from the demo's folder, and still not from /api.
              worker: {
                ...CONTENT_SECURITY_POLICY,
                connectSrc: [`${appUrl}/demo/`, `${appUrl}${DEMO_API_PREFIX}/`],
              },
            })
          : new Hono()
      )
      .route('/', site(root, '', { page: CONTENT_SECURITY_POLICY }))
  );
};

export { withFrontend };
