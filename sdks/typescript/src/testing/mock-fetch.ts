import { type Mock, vi } from 'vitest';

type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface MockedFetch {
  fetch: Mock<FetchFunction>;
  requests: Request[];
}

export const TEST_BASE_URL = 'https://api.test';
export const WORKSPACE_ID = '7f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f';
export const OTHER_WORKSPACE_ID = '0b9a8c7d-6e5f-4a3b-2c1d-0e9f8a7b6c5d';

/** A JSON response, as the API sends it. */
export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

/**
 * A `fetch` that answers with the given responses in order and records every request it saw.
 * Each response is a factory, so a retried request gets a fresh body.
 */
export function mockFetch(...responses: Array<() => Response>): MockedFetch {
  const requests: Request[] = [];
  const fetch = vi.fn<FetchFunction>(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    const next = responses.shift();
    if (!next) {
      throw new Error(`Unexpected request: ${request.method} ${request.url}`);
    }
    return next();
  });
  return { fetch, requests };
}
