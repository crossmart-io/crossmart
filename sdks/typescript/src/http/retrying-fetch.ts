import type { RetryPolicy } from './retry-policy.js';

export type FetchRequest = (request: Request) => Promise<Response>;
export type Sleep = (delayMs: number, signal?: AbortSignal) => Promise<void>;

/** Waits `delayMs`, or rejects as soon as `signal` aborts. */
export const sleep: Sleep = (delayMs, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);
    function onAbort(): void {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Wraps `fetch` so idempotent requests are sent again after a 429, a 5xx or a network failure,
 * waiting for `Retry-After` when the server sends it and backing off exponentially otherwise.
 * Other requests are sent once.
 */
export function createRetryingFetch(
  fetchImpl: FetchRequest,
  policy: RetryPolicy,
  wait: Sleep = sleep,
): FetchRequest {
  return async (request) => {
    if (!policy.canRetry(request.method)) {
      return fetchImpl(request);
    }
    for (let attempt = 0; ; attempt += 1) {
      const isLastAttempt = attempt >= policy.maxRetries;
      const outcome = await sendOnce(fetchImpl, request, isLastAttempt).then(
        (response) => (isLastAttempt ? response : retryDelay(policy, response, attempt)),
        (error: unknown) => failureDelay(policy, { request, attempt, isLastAttempt }, error),
      );
      if (outcome instanceof Response) {
        return outcome;
      }
      await wait(outcome, request.signal);
    }
  };
}

/** The last attempt may consume the request itself; earlier ones send a copy, so the body survives. */
function sendOnce(
  fetchImpl: FetchRequest,
  request: Request,
  isLastAttempt: boolean,
): Promise<Response> {
  return fetchImpl(isLastAttempt ? request : request.clone());
}

/** The response to return, or how long to wait before trying again. */
function retryDelay(policy: RetryPolicy, response: Response, attempt: number): Response | number {
  if (!policy.isRetryableStatus(response.status)) {
    return response;
  }
  const delayMs = policy.delayAfterResponse(response, attempt);
  if (delayMs === null) {
    return response;
  }
  // The response is dropped, so its body is released rather than left to the garbage collector.
  response.body?.cancel().catch(() => undefined);
  return delayMs;
}

/** Where a request is in its retries. */
interface AttemptState {
  request: Request;
  attempt: number;
  isLastAttempt: boolean;
}

/** Network failures are retried; an abort or the last attempt's failure is thrown. */
function failureDelay(
  policy: RetryPolicy,
  { request, attempt, isLastAttempt }: AttemptState,
  error: unknown,
): number {
  if (isLastAttempt || request.signal.aborted) {
    throw error;
  }
  return policy.backoffDelay(attempt);
}
