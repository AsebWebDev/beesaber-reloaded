import { describe, expect, it, vi } from 'vitest';

import { createThrottledFetch } from './throttledFetch.ts';

const ok = () => new Response('ok');
const tooManyRequests = (retryAfter?: string) =>
  new Response('slow down', {
    status: 429,
    headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter },
  });

describe('createThrottledFetch', () => {
  it('sends requests one after the other, with a pause in between', async () => {
    const log: string[] = [];
    const baseFetch = vi.fn((request: Request) => {
      log.push(`fetch ${new URL(request.url).pathname}`);

      return Promise.resolve(ok());
    });
    const sleep = vi.fn((ms: number) => {
      log.push(`sleep ${ms}`);

      return Promise.resolve();
    });
    const throttled = createThrottledFetch({
      fetch: baseFetch as typeof fetch,
      minIntervalMs: 100,
      sleep,
    });

    await Promise.all([
      throttled('https://example.test/a'),
      throttled('https://example.test/b'),
    ]);

    expect(log.slice(0, 3)).toEqual(['fetch /a', 'sleep 100', 'fetch /b']);
  });

  it('waits as long as Retry-After says and sends the request again', async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tooManyRequests('7'))
      .mockResolvedValueOnce(ok());
    const sleep = vi.fn(() => Promise.resolve());
    const throttled = createThrottledFetch({
      fetch: baseFetch,
      minIntervalMs: 0,
      sleep,
    });

    const response = await throttled('https://example.test/a');

    expect(response.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(7000);
  });

  it('gives up after the allowed number of retries', async () => {
    const baseFetch = vi.fn<typeof fetch>(() =>
      Promise.resolve(tooManyRequests())
    );
    const throttled = createThrottledFetch({
      fetch: baseFetch,
      maxRetries: 2,
      minIntervalMs: 0,
      sleep: () => Promise.resolve(),
    });

    const response = await throttled('https://example.test/a');

    expect(response.status).toBe(429);
    expect(baseFetch).toHaveBeenCalledTimes(3);
  });

  it('keeps going after a request that failed', async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(ok());
    const throttled = createThrottledFetch({
      fetch: baseFetch,
      minIntervalMs: 0,
      sleep: () => Promise.resolve(),
    });

    await expect(throttled('https://example.test/a')).rejects.toThrow(
      'network down'
    );
    await expect(throttled('https://example.test/b')).resolves.toHaveProperty(
      'status',
      200
    );
  });
});
