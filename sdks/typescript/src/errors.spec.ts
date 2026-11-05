import { describe, expect, it } from 'vitest';
import { Crossmart } from './crossmart.js';
import { CrossmartApiError, CrossmartError } from './errors.js';
import { EntitlementErrorCode } from './generated/schema.js';
import { jsonResponse, mockFetch, TEST_BASE_URL, WORKSPACE_ID } from './testing/mock-fetch.js';

const PRODUCT_ID = '3c1e9a5b-2f4d-4e6a-8b7c-9d0e1f2a3b4c';
const CONNECTION_ID = '5d2f0b6c-3a5e-4f7b-9c8d-0e1f2a3b4c5d';

function clientAnswering(response: () => Response): Crossmart {
  const { fetch } = mockFetch(response);
  return new Crossmart(
    { apiKey: 'key' },
    { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch, retry: { maxRetries: 0 } },
  );
}

async function errorOf(promise: Promise<unknown>): Promise<CrossmartApiError> {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  if (!(error instanceof CrossmartApiError)) {
    throw new Error('Expected a CrossmartApiError');
  }
  return error;
}

describe('CrossmartApiError', () => {
  it("carries the status and the API's message", async () => {
    const crossmart = clientAnswering(() =>
      jsonResponse({ statusCode: 404, error: 'Not Found', message: 'Product not found' }, 404),
    );

    const error = await errorOf(crossmart.products.get(PRODUCT_ID));

    expect(error).toBeInstanceOf(CrossmartError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Product not found');
    expect(error.code).toBeUndefined();
  });

  it('joins validation messages and keeps each one in details', async () => {
    const messages = ['title should not be empty', 'variants must contain at least 1 elements'];
    const crossmart = clientAnswering(() =>
      jsonResponse({ statusCode: 400, error: 'Bad Request', message: messages }, 400),
    );

    const error = await errorOf(crossmart.products.create({ title: '', variants: [] }));

    expect(error.status).toBe(400);
    expect(error.details).toEqual(messages);
    expect(error.message).toBe(messages.join('. '));
  });

  it('exposes the code and body of a plan limit refusal', async () => {
    const body = {
      statusCode: 402,
      error: 'Payment Required',
      code: EntitlementErrorCode.plan_limit_reached,
      message: 'The Starter plan includes 500 active listings, and 500 are in use.',
      feature: 'active_listings',
      plan: 'starter',
      limit: 500,
      usage: 500,
      requested: 1,
    };
    const crossmart = clientAnswering(() => jsonResponse(body, 402));

    const error = await errorOf(crossmart.listings.publish(PRODUCT_ID, CONNECTION_ID));

    expect(error.status).toBe(402);
    expect(error.code).toBe(EntitlementErrorCode.plan_limit_reached);
    expect(error.body).toEqual(body);
  });

  it('falls back to a generic message when the body has none', async () => {
    const crossmart = clientAnswering(() => new Response('', { status: 502 }));

    const error = await errorOf(crossmart.orders.list());

    expect(error.status).toBe(502);
    expect(error.message).toBe('The Crossmart API returned an error');
  });

  it('uses a plain-text body as the message', async () => {
    const crossmart = clientAnswering(() => new Response('Bad gateway', { status: 502 }));

    const error = await errorOf(crossmart.orders.list());

    expect(error.message).toBe('Bad gateway');
  });
});
