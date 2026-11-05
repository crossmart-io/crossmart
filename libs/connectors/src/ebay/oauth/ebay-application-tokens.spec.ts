import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createEbayTestKit, FIXTURES, TOKEN_URL } from '../ebay.fixtures.js';
import { EbayApplicationTokens } from './ebay-application-tokens.js';

const NOW = new Date('2026-11-05T10:00:00Z');
const APPLICATION_TOKEN = 'v^1.1#i^1#fixture_application_token';

function setup() {
  const { http, oauth } = createEbayTestKit();
  return { http, tokens: new EbayApplicationTokens(oauth) };
}

describe('EbayApplicationTokens', () => {
  it('requests one token and reuses it until shortly before it expires', async () => {
    const { http, tokens } = setup();
    const token = fixtureResponse(FIXTURES, 'application-token.json');
    http.expect(HttpMethod.Post, TOKEN_URL, token).expect(HttpMethod.Post, TOKEN_URL, token);

    await expect(tokens.accessToken(NOW)).resolves.toBe(APPLICATION_TOKEN);
    await tokens.accessToken(new Date('2026-11-05T11:54:00Z'));
    expect(http.requests).toHaveLength(1);

    await tokens.accessToken(new Date('2026-11-05T11:56:00Z'));
    expect(http.requests).toHaveLength(2);
  });

  it('tries again after a failed request', async () => {
    const { http, tokens } = setup();
    http
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'server_error' }, 503))
      .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'application-token.json'));

    await expect(tokens.accessToken(NOW)).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
    });
    await expect(tokens.accessToken(NOW)).resolves.toBe(APPLICATION_TOKEN);
  });
});
