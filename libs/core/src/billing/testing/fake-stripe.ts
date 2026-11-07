import { readFileSync } from 'node:fs';
import Stripe from 'stripe';

const FIXTURES = new URL('../providers/stripe/__fixtures__/', import.meta.url);
const FIXTURE_ENCODING = 'utf8';
const JSON_HEADERS = { 'content-type': 'application/json' };
const HTTP_OK = 200;
/** A test secret: the fake never sends it anywhere. */
export const TEST_STRIPE_KEY = 'sk_test_crossmart_fixture';
export const TEST_WEBHOOK_SECRET = 'whsec_crossmart_fixture';

/** A recorded Stripe fixture's text. Fixtures hold fabricated data only. */
export function stripeFixture(name: string): string {
  return readFileSync(new URL(name, FIXTURES), FIXTURE_ENCODING);
}

/** A request the fake received: the API path and its form-encoded parameters. */
export interface RecordedStripeRequest {
  method: string;
  path: string;
  params: URLSearchParams;
  idempotencyKey: string | null;
}

/**
 * Answers Stripe API calls with fixtures, in order, so the real Stripe client runs in tests and
 * nothing reaches the network. Every request is recorded for assertions.
 */
export class FakeStripeFetch {
  readonly requests: RecordedStripeRequest[] = [];
  private readonly replies: { body: string; status: number }[] = [];

  /** The parameters of the `index`th request; throws when there was none. */
  paramsOf(index: number): URLSearchParams {
    const request = this.requests[index];
    if (!request) throw new Error(`No Stripe request #${index}`);
    return request.params;
  }

  reply(fixtureName: string): this {
    this.replies.push({ body: stripeFixture(fixtureName), status: HTTP_OK });
    return this;
  }

  /** Answers the next request with `body`, such as one of Stripe's error objects. */
  replyJson(body: unknown, status = HTTP_OK): this {
    this.replies.push({ body: JSON.stringify(body), status });
    return this;
  }

  /** A Stripe client whose every request is answered by this fake. */
  client(): Stripe {
    return new Stripe(TEST_STRIPE_KEY, {
      httpClient: Stripe.createFetchHttpClient(this.fetch),
      maxNetworkRetries: 0,
    });
  }

  private readonly fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const headers = new Headers(init?.headers);
    const query = url.searchParams.toString();
    const body = typeof init?.body === 'string' ? init.body : '';
    this.requests.push({
      method: init?.method ?? 'GET',
      path: url.pathname,
      params: new URLSearchParams(body || query),
      idempotencyKey: headers.get('idempotency-key'),
    });
    const reply = this.replies.shift();
    if (reply === undefined) {
      return Promise.reject(new Error(`Unexpected Stripe request ${url.pathname}`));
    }
    return Promise.resolve(
      new Response(reply.body, { status: reply.status, headers: JSON_HEADERS }),
    );
  };
}

/** A webhook delivery as Stripe would sign it with `TEST_WEBHOOK_SECRET`. */
export function signedStripeEvent(fixtureName: string): { payload: Buffer; signature: string } {
  const payload = stripeFixture(fixtureName);
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: TEST_WEBHOOK_SECRET,
  });
  return { payload: Buffer.from(payload), signature };
}
