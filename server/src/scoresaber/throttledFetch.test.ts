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

  it('does not wait longer than the cap, whatever Retry-After says', async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tooManyRequests('3600'))
      .mockResolvedValueOnce(ok());
    const sleep = vi.fn(() => Promise.resolve());
    const throttled = createThrottledFetch({
      fetch: baseFetch,
      maxRetryAfterMs: 30_000,
      minIntervalMs: 0,
      sleep,
    });

    await throttled('https://example.test/a');

    expect(sleep).toHaveBeenCalledWith(30_000);
    expect(sleep).not.toHaveBeenCalledWith(3_600_000);
  });

  it('gives up on a request that gets no answer, and lets the next one through', async () => {
    // Answers the first request never, like a server that accepted the
    // connection and then went quiet. Only an abort ends it.
    const hang: typeof fetch = (input) =>
      new Promise<Response>((_resolve, reject) => {
        const { signal } = input as Request;

        signal.addEventListener('abort', () => reject(signal.reason as Error));
      });
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(hang)
      .mockResolvedValueOnce(ok());
    const throttled = createThrottledFetch({
      fetch: baseFetch,
      minIntervalMs: 0,
      sleep: () => Promise.resolve(),
      timeoutMs: 30,
    });

    const first = throttled('https://example.test/a');
    const second = throttled('https://example.test/b');

    await expect(first).rejects.toThrow();
    await expect(second).resolves.toHaveProperty('status', 200);
  });

  it('stops when the caller gives up', async () => {
    const baseFetch = vi.fn<typeof fetch>(
      (input) =>
        new Promise<Response>((_resolve, reject) => {
          const { signal } = input as Request;

          signal.addEventListener('abort', () =>
            reject(signal.reason as Error)
          );
        })
    );
    const throttled = createThrottledFetch({
      fetch: baseFetch,
      minIntervalMs: 0,
      sleep: () => Promise.resolve(),
    });
    const controller = new AbortController();
    const request = throttled('https://example.test/a', {
      signal: controller.signal,
    });

    // Let the request start before it is called off
    await new Promise((resolve) => setTimeout(resolve, 10));
    controller.abort(new Error('caller gave up'));

    await expect(request).rejects.toThrow('caller gave up');
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
