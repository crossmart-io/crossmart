import { z } from 'zod';
import { ChannelType } from '../channel-type.enum.js';
import { ChannelError } from '../errors/channel-error.js';
import { ChannelErrorCode } from '../errors/channel-error-code.enum.js';
import type { ChannelErrorMessages } from '../errors/channel-error-factory.js';
import { FakeHttpTransport, jsonResponse } from '../testing/fake-http-transport.js';
import { HttpMethod } from './http-method.enum.js';
import type { HttpResponse, HttpTransport } from './http-transport.js';
import { type JsonApiFailure, type JsonApiRequest, JsonApiClient } from './json-api.client.js';

const BASE_URL = 'https://api.example.com';
const MESSAGES: ChannelErrorMessages = {
  [ChannelErrorCode.InvalidAccount]: 'invalid account',
  [ChannelErrorCode.InvalidSignature]: 'invalid signature',
  [ChannelErrorCode.AccessDenied]: 'access denied',
  [ChannelErrorCode.MissingScopes]: 'missing scopes',
  [ChannelErrorCode.CredentialsRejected]: 'credentials rejected',
  [ChannelErrorCode.RateLimited]: 'rate limited',
  [ChannelErrorCode.ChannelUnavailable]: 'unavailable',
  [ChannelErrorCode.RequestRejected]: 'rejected',
};

interface TestRequest extends JsonApiRequest {
  path: string;
}

/** Reads `{ "reason": "..." }` bodies; a 403 names its cause exactly. */
class TestApiClient extends JsonApiClient<TestRequest> {
  constructor(http: HttpTransport) {
    super(http, {
      error: (code, message) => new ChannelError(ChannelType.Ebay, code, message),
      messages: MESSAGES,
    });
  }

  protected url(request: TestRequest): URL {
    return new URL(request.path, BASE_URL);
  }

  protected describeFailure(response: HttpResponse): JsonApiFailure {
    if (response.status === 403) return { code: ChannelErrorCode.AccessDenied, message: 'exact' };
    const parsed = z.object({ reason: z.string() }).safeParse(JSON.parse(response.body));
    return { code: ChannelErrorCode.RequestRejected, detail: parsed.data?.reason ?? null };
  }
}

const schema = z.object({ id: z.string() });

function setup() {
  const http = new FakeHttpTransport();
  return { http, api: new TestApiClient(http) };
}

describe('JsonApiClient', () => {
  it('sends JSON with the bearer token and validates the answer', async () => {
    const { http, api } = setup();
    http.expect(HttpMethod.Post, `${BASE_URL}/items`, jsonResponse({ id: 'item-1' }));

    const item = await api.call(
      { method: HttpMethod.Post, path: '/items', accessToken: 'token', body: { name: 'Mug' } },
      schema,
    );

    expect(item).toEqual({ id: 'item-1' });
    expect(http.requests[0]).toMatchObject({
      headers: {
        authorization: 'Bearer token',
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: '{"name":"Mug"}',
    });
  });

  it('sends no body or content type on a read', async () => {
    const { http, api } = setup();
    http.expect(HttpMethod.Get, `${BASE_URL}/items/1`, jsonResponse({}, 204));

    await api.execute({ method: HttpMethod.Get, path: '/items/1', accessToken: 'token' });

    expect(http.requests[0]?.body).toBeUndefined();
    expect(http.requests[0]?.headers).not.toHaveProperty('content-type');
  });

  it('names the failure the channel describes, with its detail or exact message', async () => {
    const { http, api } = setup();
    http
      .expect(HttpMethod.Get, `${BASE_URL}/a`, jsonResponse({ reason: 'Brand is missing' }, 400))
      .expect(HttpMethod.Get, `${BASE_URL}/b`, jsonResponse({}, 400))
      .expect(HttpMethod.Get, `${BASE_URL}/c`, jsonResponse({}, 403));

    await expect(
      api.call({ method: HttpMethod.Get, path: '/a', accessToken: 't' }, schema),
    ).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: 'rejected: Brand is missing',
    });
    await expect(
      api.call({ method: HttpMethod.Get, path: '/b', accessToken: 't' }, schema),
    ).rejects.toMatchObject({ message: 'rejected' });
    await expect(
      api.execute({ method: HttpMethod.Get, path: '/c', accessToken: 't' }),
    ).rejects.toMatchObject({ code: ChannelErrorCode.AccessDenied, message: 'exact' });
  });

  it('reports an outage when the channel is unreachable or answers the wrong shape', async () => {
    const { http, api } = setup();
    http
      .expect(HttpMethod.Get, `${BASE_URL}/a`, new Error('socket hang up'))
      .expect(HttpMethod.Get, `${BASE_URL}/b`, jsonResponse({ unexpected: true }));
    const outage = { code: ChannelErrorCode.ChannelUnavailable, message: 'unavailable' };

    await expect(
      api.request({ method: HttpMethod.Get, path: '/a', accessToken: 't' }),
    ).rejects.toMatchObject(outage);
    await expect(
      api.call({ method: HttpMethod.Get, path: '/b', accessToken: 't' }, schema),
    ).rejects.toMatchObject(outage);
  });

  it('answers the raw response of a failed call to callers that read it themselves', async () => {
    const { http, api } = setup();
    http.expect(HttpMethod.Get, `${BASE_URL}/a`, jsonResponse({ reason: 'gone' }, 404));

    const response = await api.request({ method: HttpMethod.Get, path: '/a', accessToken: 't' });

    expect(response.status).toBe(404);
  });
});
