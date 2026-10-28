import { Hono } from 'hono';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { withFrontend } from './frontend.ts';

// A built frontend as `pnpm build` leaves it: the page and its files
const root = mkdtempSync(join(tmpdir(), 'beesaber-frontend-'));

mkdirSync(join(root, 'assets'));
writeFileSync(
  join(root, 'index.html'),
  '<!doctype html><title>BeeSaber</title>'
);
writeFileSync(join(root, 'assets', 'index-1a2b.js'), 'console.log("app")');
// The compressed copies the build writes next to the files. Their content
// does not matter here, only which one is handed out.
writeFileSync(join(root, 'assets', 'index-1a2b.js.br'), 'brotli bytes');
writeFileSync(join(root, 'assets', 'index-1a2b.js.gz'), 'gzip bytes');
writeFileSync(join(root, 'index.html.br'), 'brotli page');
writeFileSync(join(root, 'favicon.ico'), 'icon');

// The demo, which the build puts into a folder of its own
mkdirSync(join(root, 'demo', 'assets'), { recursive: true });
writeFileSync(
  join(root, 'demo', 'index.html'),
  '<!doctype html><title>BeeSaber demo</title>'
);
writeFileSync(join(root, 'demo', 'assets', 'demo-9z8y.js'), 'demo()');
writeFileSync(join(root, 'demo', 'mockServiceWorker.js'), 'worker()');

// Outside the folder that is handed out
writeFileSync(join(tmpdir(), 'beesaber-secret.txt'), 'secret');

afterAll(() => {
  rmSync(root, { recursive: true });
  rmSync(join(tmpdir(), 'beesaber-secret.txt'));
});

const api = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ status: 'ok' }))
  .notFound((c) => c.json({ error: { code: 'not_found' } }, 404));

const site = withFrontend(api, root, { appUrl: 'https://beesaber.test' });

describe('the server with the built frontend', () => {
  it('passes requests under /api to the API', async () => {
    const response = await site.request('/api/health');

    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('lets the API answer an unknown API path, instead of handing out the page', async () => {
    const response = await site.request('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'not_found' } });
  });

  it('hands out the page at the root address', async () => {
    const response = await site.request('/');

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<title>BeeSaber</title>');
  });

  it('hands out the page for any address of the app, so React can draw it', async () => {
    const response = await site.request('/hive/76561198000000002');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^text\/html/);
    expect(await response.text()).toContain('<title>BeeSaber</title>');
  });

  it('hands out a built file with its type', async () => {
    const response = await site.request('/assets/index-1a2b.js');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/javascript/);
    expect(await response.text()).toBe('console.log("app")');
  });

  it('answers 404 for a file that does not exist, not the page', async () => {
    const response = await site.request('/assets/index-old.js');

    expect(response.status).toBe(404);
  });

  it('lets browsers keep the built files for good, but not the page', async () => {
    const file = await site.request('/assets/index-1a2b.js');
    const page = await site.request('/profile');

    expect(file.headers.get('cache-control')).toContain('immutable');
    expect(page.headers.get('cache-control')).toBe('no-cache');
  });

  it('hands out the smallest compressed copy that the browser understands', async () => {
    const brotli = await site.request('/assets/index-1a2b.js', {
      headers: { 'Accept-Encoding': 'gzip, deflate, br' },
    });
    const gzip = await site.request('/assets/index-1a2b.js', {
      headers: { 'Accept-Encoding': 'gzip' },
    });

    expect(brotli.headers.get('content-encoding')).toBe('br');
    expect(await brotli.text()).toBe('brotli bytes');
    expect(gzip.headers.get('content-encoding')).toBe('gzip');
    expect(await gzip.text()).toBe('gzip bytes');
    // Caches between browser and server must keep the copies apart
    expect(brotli.headers.get('vary')).toContain('Accept-Encoding');
    expect(brotli.headers.get('content-type')).toMatch(/javascript/);
  });

  it('hands out the file as it is to a browser that asks for no compression', async () => {
    const response = await site.request('/assets/index-1a2b.js');

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(await response.text()).toBe('console.log("app")');
  });

  it('compresses the page for any address of the app as well', async () => {
    const response = await site.request('/hive/1', {
      headers: { 'Accept-Encoding': 'br' },
    });

    expect(response.headers.get('content-encoding')).toBe('br');
    expect(response.headers.get('content-type')).toMatch(/^text\/html/);
    expect(await response.text()).toBe('brotli page');
  });

  it('does not cache a 404', async () => {
    const response = await site.request('/assets/index-old.js');

    expect(response.headers.get('cache-control')).toBeNull();
  });

  it('hands out nothing from outside its folder', async () => {
    for (const path of [
      '/../beesaber-secret.txt',
      '/%2e%2e/beesaber-secret.txt',
      '/assets/..%2f..%2fbeesaber-secret.txt',
    ]) {
      const response = await site.request(path);

      expect(await response.text()).not.toContain('secret');
    }
  });

  it('sends the strict browser headers with the page too', async () => {
    const response = await site.request('/');

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });

  it('tells the browser to run only the app’s own scripts on its pages', async () => {
    const policy = (await site.request('/hive/1')).headers.get(
      'content-security-policy'
    );

    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    // No inline scripts, not even as a fallback through default-src
    expect(policy).not.toMatch(/script-src[^;]*unsafe/);
  });

  it('refuses to start without a built frontend', () => {
    expect(() =>
      withFrontend(api, join(root, 'missing'), {
        appUrl: 'https://beesaber.test',
      })
    ).toThrow(/pnpm build/);
  });
});

describe('the demo next to the app', () => {
  it('sends /demo to /demo/, the folder its service worker controls', async () => {
    const response = await site.request('/demo');

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/demo/');
  });

  it('hands out the demo for every address under /demo/', async () => {
    for (const path of ['/demo/', '/demo/hive/76561198400000002']) {
      const response = await site.request(path);

      expect(await response.text()).toContain('BeeSaber demo');
    }
  });

  it('hands out the demo’s files from its own folder', async () => {
    const file = await site.request('/demo/assets/demo-9z8y.js');
    const worker = await site.request('/demo/mockServiceWorker.js');

    expect(await file.text()).toBe('demo()');
    expect(file.headers.get('cache-control')).toContain('immutable');
    expect(await worker.text()).toBe('worker()');
    // The worker keeps its name, so browsers have to ask for it again
    expect(worker.headers.get('cache-control')).toBe('no-cache');
  });

  it('lets the demo’s pages connect to the demo’s API only, not to the real one', async () => {
    const policy = (await site.request('/demo/')).headers.get(
      'content-security-policy'
    );

    expect(policy).toContain('connect-src https://beesaber.test/demo-api/');
    expect(policy).not.toMatch(/connect-src[^;]*'self'/);
    expect(policy).toContain("script-src 'self'");
  });

  it('lets the demo’s service worker fetch the demo’s files, and still not the real API', async () => {
    const policy = (
      await site.request('/demo/mockServiceWorker.js')
    ).headers.get('content-security-policy');

    expect(policy).toContain(
      'connect-src https://beesaber.test/demo/ https://beesaber.test/demo-api/'
    );
    expect(policy).not.toMatch(/connect-src[^;]*'self'/);
  });

  it('keeps the policy of the real app as it is', async () => {
    const policy = (await site.request('/hive')).headers.get(
      'content-security-policy'
    );

    expect(policy).toContain("connect-src 'self'");
    expect(policy).not.toContain('demo-api');
  });

  it('has nothing at the demo’s API, so a request the demo missed goes nowhere', async () => {
    for (const method of ['GET', 'POST', 'DELETE']) {
      const response = await site.request('/demo-api/api/me', { method });

      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('BeeSaber');
    }
  });

  it('serves no service worker outside of /demo/, where it could answer for the real app', async () => {
    const response = await site.request('/mockServiceWorker.js');

    expect(response.status).toBe(404);
  });
});
