import { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { FakeHttpTransport } from '../../sdk/testing/fake-http-transport.js';
import { FalabellaAction, FalabellaCountry } from '../falabella.enums.js';
import { actionUrl, API_KEY, SELLER_ID, USER_ID, xmlFixture } from '../falabella.fixtures.js';
import { FalabellaApiClient } from './falabella-api.client.js';

const ACCOUNT = {
  userId: USER_ID,
  apiKey: API_KEY,
  sellerId: SELLER_ID,
  country: FalabellaCountry.Peru,
};
const FEED_COUNT = { action: FalabellaAction.FeedCount };

function clientAnswering(respond: Parameters<FakeHttpTransport['expect']>[2]) {
  const http = new FakeHttpTransport().expect(
    HttpMethod.Get,
    actionUrl(FalabellaAction.FeedCount),
    respond,
  );
  return { http, client: new FalabellaApiClient(http) };
}

describe('FalabellaApiClient', () => {
  it('reads the head and body of a success, and never sends the key', async () => {
    const { client, http } = clientAnswering(xmlFixture('feed-count.xml'));

    const { head, body } = await client.call(
      ACCOUNT,
      FEED_COUNT,
      z.object({ FeedCount: z.object({ Total: z.coerce.number() }) }),
    );

    expect(head.RequestAction).toBe('FeedCount');
    expect(body.FeedCount.Total).toBe(59);
    expect(JSON.stringify(http.requests)).not.toContain(API_KEY);
    expect(http.requests[0]?.headers?.['user-agent']).toMatch(/\/FAPE$/);
  });

  it('explains a refusal with Falabella’s message and details', async () => {
    const { client } = clientAnswering(xmlFixture('error-format.xml', 400));

    await expect(client.call(ACCOUNT, FEED_COUNT, z.unknown())).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: expect.stringContaining('Format Error Detected; StandardPrice: Field must contain'),
    });
  });

  it('treats Falabella’s own failures as outages worth retrying', async () => {
    const { client } = clientAnswering(xmlFixture('error-duplicate-feed.xml'));

    await expect(client.call(ACCOUNT, FEED_COUNT, z.unknown())).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
      retryable: true,
    });
  });

  it('reads throttling, unreadable replies and network failures', async () => {
    const throttled = clientAnswering({ status: 429, headers: {}, body: 'Too many requests' });
    const garbled = clientAnswering({ status: 200, headers: {}, body: '<Other/>' });
    const offline = clientAnswering(new Error('socket hang up'));

    await expect(throttled.client.call(ACCOUNT, FEED_COUNT, z.unknown())).rejects.toMatchObject({
      code: ChannelErrorCode.RateLimited,
    });
    await expect(garbled.client.call(ACCOUNT, FEED_COUNT, z.unknown())).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
    });
    await expect(offline.client.call(ACCOUNT, FEED_COUNT, z.unknown())).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
    });
  });
});
