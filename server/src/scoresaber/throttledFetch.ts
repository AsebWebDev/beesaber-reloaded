type Options = {
  fetch?: typeof fetch;
  /** The longest a "429 Too Many Requests" may make us wait before retrying */
  maxRetryAfterMs?: number;
  /** How often a request is repeated after "429 Too Many Requests" */
  maxRetries?: number;
  /** Pause between the start of two requests */
  minIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
  /** How long one attempt may take before it is given up */
  timeoutMs?: number;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wraps `fetch` so the server stays within ScoreSaber's rate limit
 * (25 requests per second, 400 per minute) and never waits on it forever.
 *
 * - Requests run one after the other with a pause in between, no matter how
 *   many parts of the server ask at the same time.
 * - Every attempt has a time limit. Without one, a server that accepts the
 *   connection and then says nothing would hold up everything queued behind
 *   it for minutes.
 * - When ScoreSaber answers 429, the request waits for as long as the
 *   `Retry-After` header says, but not longer than `maxRetryAfterMs`, and is
 *   sent again.
 *
 * Each call of this function is a lane of its own. The server uses two, so
 * that a long background sync cannot keep a user's search waiting.
 */
const createThrottledFetch = ({
  fetch: baseFetch = fetch,
  maxRetryAfterMs = 30_000,
  maxRetries = 3,
  minIntervalMs = 60,
  sleep = defaultSleep,
  timeoutMs = 15_000,
}: Options = {}): typeof fetch => {
  // Every request appends itself to this chain and so waits for the one before
  let queue: Promise<unknown> = Promise.resolve();

  const send = async (request: Request): Promise<Response> => {
    for (let attempt = 0; ; attempt++) {
      // A request body can be read only once, so every attempt gets a copy.
      // The copy is aborted when the time is up, or when the caller gives up.
      const response = await baseFetch(
        new Request(request.clone(), {
          signal: AbortSignal.any([
            request.signal,
            AbortSignal.timeout(timeoutMs),
          ]),
        })
      );

      if (response.status !== 429 || attempt === maxRetries) return response;

      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const askedFor =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : 1000 * 2 ** attempt;

      await sleep(Math.min(askedFor, maxRetryAfterMs));
    }
  };

  return (input, init) => {
    const request = new Request(input, init);
    const result = queue.then(() => send(request));

    // The next request starts after this one has finished and the pause has
    // passed, whether this one succeeded or not
    queue = result.then(
      () => sleep(minIntervalMs),
      () => sleep(minIntervalMs)
    );

    return result;
  };
};

export { createThrottledFetch };
