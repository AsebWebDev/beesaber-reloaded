type Options = {
  fetch?: typeof fetch;
  /** Pause between the start of two requests */
  minIntervalMs?: number;
  /** How often a request is repeated after "429 Too Many Requests" */
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wraps `fetch` so the server stays within ScoreSaber's rate limit
 * (25 requests per second, 400 per minute).
 *
 * - Requests run one after the other with a pause in between, no matter how
 *   many parts of the server ask at the same time.
 * - When ScoreSaber still answers 429, the request waits for as long as the
 *   `Retry-After` header says and is sent again.
 */
const createThrottledFetch = ({
  fetch: baseFetch = fetch,
  minIntervalMs = 60,
  maxRetries = 3,
  sleep = defaultSleep,
}: Options = {}): typeof fetch => {
  // Every request appends itself to this chain and so waits for the one before
  let queue: Promise<unknown> = Promise.resolve();

  const send = async (request: Request): Promise<Response> => {
    for (let attempt = 0; ; attempt++) {
      // A request body can be read only once, so every attempt gets a copy
      const response = await baseFetch(request.clone());

      if (response.status !== 429 || attempt === maxRetries) return response;

      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const waitMs =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : 1000 * 2 ** attempt;

      await sleep(waitMs);
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
