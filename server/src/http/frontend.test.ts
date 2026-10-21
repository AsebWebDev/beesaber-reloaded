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
writeFileSync(join(root, 'favicon.ico'), 'icon');

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

const site = withFrontend(api, root);

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
    expect(() => withFrontend(api, join(root, 'missing'))).toThrow(
      /pnpm build/
    );
  });
});
