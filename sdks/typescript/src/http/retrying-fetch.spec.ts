import { describe, expect, it, vi } from 'vitest';
import { emptyResponse, jsonResponse, mockFetch, TEST_BASE_URL } from '../testing/mock-fetch.js';
import { RetryPolicy } from './retry-policy.js';
import { createRetryingFetch, sleep } from './retrying-fetch.js';

const URL_UNDER_TEST = `${TEST_BASE_URL}/api/v1/workspaces/ws/products`;
const noJitter = (): number => 0;

function setUp(responses: Array<() => Response>, maxRetries = 2) {
  const { fetch, requests } = mockFetch(...responses);
  const waits: number[] = [];
  const wait = vi.fn(async (delayMs: number) => {
    waits.push(delayMs);
  });
  const policy = new RetryPolicy({ maxRetries, initialDelayMs: 100 }, noJitter);
  const retryingFetch = createRetryingFetch((request) => fetch(request), policy, wait);
  return { retryingFetch, requests, waits };
}

describe('createRetryingFetch', () => {
  it('retries a GET after a 5xx and returns the success', async () => {
    const { retryingFetch, requests, waits } = setUp([
      () => jsonResponse({ message: 'down' }, 503),
      () => jsonResponse({ ok: true }),
    ]);

    const response = await retryingFetch(new Request(URL_UNDER_TEST));

    expect(response.status).toBe(200);
    expect(requests).toHaveLength(2);
    expect(waits).toEqual([100]);
  });

  it('waits for Retry-After on a 429', async () => {
    const { retryingFetch, waits } = setUp([
      () => jsonResponse({ message: 'slow down' }, 429, { 'retry-after': '3' }),
      () => jsonResponse({ ok: true }),
    ]);

    await retryingFetch(new Request(URL_UNDER_TEST));

    expect(waits).toEqual([3000]);
  });

  it('backs off exponentially and returns the last failure after maxRetries', async () => {
    const { retryingFetch, requests, waits } = setUp([
      () => jsonResponse({}, 500),
      () => jsonResponse({}, 502),
      () => jsonResponse({ message: 'still down' }, 503),
    ]);

    const response = await retryingFetch(new Request(URL_UNDER_TEST));

    expect(response.status).toBe(503);
    expect(requests).toHaveLength(3);
    expect(waits).toEqual([100, 200]);
  });

  it('never retries a POST', async () => {
    const { retryingFetch, requests } = setUp([() => jsonResponse({}, 503)]);

    const response = await retryingFetch(
      new Request(URL_UNDER_TEST, { method: 'POST', body: '{}' }),
    );

    expect(response.status).toBe(503);
    expect(requests).toHaveLength(1);
  });

  it('does not retry a client error', async () => {
    const { retryingFetch, requests } = setUp([() => jsonResponse({}, 404)]);

    await retryingFetch(new Request(URL_UNDER_TEST));

    expect(requests).toHaveLength(1);
  });

  it('returns a 429 at once when Retry-After is too long to wait', async () => {
    const { retryingFetch, requests } = setUp([
      () => jsonResponse({}, 429, { 'retry-after': '3600' }),
    ]);

    const response = await retryingFetch(new Request(URL_UNDER_TEST));

    expect(response.status).toBe(429);
    expect(requests).toHaveLength(1);
  });

  it('resends the body of a retried PUT', async () => {
    const { retryingFetch, requests } = setUp([() => jsonResponse({}, 503), () => emptyResponse()]);

    await retryingFetch(new Request(URL_UNDER_TEST, { method: 'PUT', body: '{"title":"Mug"}' }));

    const bodies = await Promise.all(requests.map((request) => request.text()));
    expect(bodies).toEqual(['{"title":"Mug"}', '{"title":"Mug"}']);
  });

  it('retries a network failure, then throws it on the last attempt', async () => {
    const failure = new TypeError('fetch failed');
    const fetch = vi.fn<(request: Request) => Promise<Response>>().mockRejectedValue(failure);
    const policy = new RetryPolicy({ maxRetries: 1, initialDelayMs: 0 }, noJitter);
    const retryingFetch = createRetryingFetch(fetch, policy, async () => undefined);

    await expect(retryingFetch(new Request(URL_UNDER_TEST))).rejects.toBe(failure);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry an aborted request', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('aborted', 'AbortError');
    const fetch = vi.fn<(request: Request) => Promise<Response>>().mockRejectedValue(abortError);
    const retryingFetch = createRetryingFetch(fetch, new RetryPolicy(), async () => undefined);

    await expect(
      retryingFetch(new Request(URL_UNDER_TEST, { signal: controller.signal })),
    ).rejects.toBe(abortError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('sleep', () => {
  it('resolves after the delay', async () => {
    vi.useFakeTimers();
    let resolved = false;
    const waiting = sleep(1000);
    void waiting.finally(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });

  it('rejects when the signal aborts', async () => {
    const controller = new AbortController();
    const waiting = sleep(60_000, controller.signal);
    controller.abort(new Error('cancelled'));

    await expect(waiting).rejects.toThrow('cancelled');
  });
});
