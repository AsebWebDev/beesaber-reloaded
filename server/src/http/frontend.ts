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

/**
 * The whole app behind one address: requests under /api go to the API,
 * every other request gets the built frontend (`pnpm build` puts it into
 * client/dist).
 *
 * One address for both is what the rest of the app relies on. The session
 * cookie is only sent along to the site that set it, and the API sends no
 * CORS headers, so a frontend on another address could not use it.
 */
const withFrontend = (api: Api, root: string) => {
  if (!existsSync(join(root, 'index.html')))
    throw new Error(
      `No built frontend in ${root}: index.html is missing. Run "pnpm build" first.`
    );

  return (
    new Hono()
      // The API answers for itself, its errors and "not found" included.
      // `env` carries the connection, which the rate limit reads the
      // caller's address from.
      .all('/api/*', (c) => api.fetch(c.req.raw, c.env))

      .use(secureHeaders({ contentSecurityPolicy: CONTENT_SECURITY_POLICY }))
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

      // The build puts a Brotli and a gzip copy next to every text file
      // (client/build/precompress.ts). A browser that understands one of
      // them gets it, a third of the size; the others get the file as it is.
      .use(serveStatic({ root, precompressed: true }))
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

export { withFrontend };
