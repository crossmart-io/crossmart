import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { encodeParams } from '../../sdk/http/form-encoding.js';
import { HttpTransport } from '../../sdk/http/http-transport.js';
import {
  OAUTH_CODE_RESPONSE_TYPE,
  OAUTH_SCOPE_SEPARATOR,
  OAuthClientAuthentication,
  OAuthGrantType,
  OAuthParam,
} from '../../sdk/oauth/oauth.constants.js';
import { OAuthTokenEndpoint } from '../../sdk/oauth/oauth-token-endpoint.js';
import type { OAuthTokenGrant } from '../../sdk/oauth/oauth-token-response.js';
import {
  EBAY_APPLICATION_TOKEN_SCOPES,
  EBAY_AUTHORIZE_PATH,
  EBAY_REQUIRED_SCOPES,
  EBAY_TOKEN_PATH,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { ebayError } from '../ebay-errors.js';
import { type EbayApplicationToken, toEbayApplicationToken } from './ebay-token-response.js';

const EXCHANGE_FAILED = 'eBay did not issue an access token';
const REFRESH_REJECTED = 'eBay no longer accepts this connection. Connect the eBay account again.';

/**
 * eBay's authorization code grant: the sign-in URL, the code exchange and the refresh. eBay
 * takes the app's RuName where OAuth expects the redirect URL, and the app's credentials as
 * HTTP Basic auth. Tokens never appear in errors.
 */
@Injectable()
export class EbayOAuthClient {
  private readonly tokens: OAuthTokenEndpoint;

  constructor(
    private readonly app: EbayApp,
    http: HttpTransport,
  ) {
    this.tokens = new OAuthTokenEndpoint(http, {
      tokenUrl: () => new URL(EBAY_TOKEN_PATH, this.app.hosts().api).toString(),
      client: () => this.app.settings(),
      clientAuthentication: OAuthClientAuthentication.HttpBasic,
      error: ebayError,
      messages: { exchangeFailed: EXCHANGE_FAILED, refreshRejected: REFRESH_REJECTED },
    });
  }

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  authorizationUrl(state: string): URL {
    const { clientId, ruName } = this.app.settings();
    const url = new URL(EBAY_AUTHORIZE_PATH, this.app.hosts().auth);
    url.search = encodeParams({
      [OAuthParam.ClientId]: clientId,
      [OAuthParam.ResponseType]: OAUTH_CODE_RESPONSE_TYPE,
      [OAuthParam.RedirectUri]: ruName,
      [OAuthParam.Scope]: EBAY_REQUIRED_SCOPES.join(OAUTH_SCOPE_SEPARATOR),
      [OAuthParam.State]: state,
    });
    return url;
  }

  /** eBay's code grant lists no scopes: it grants all requested ones or none. */
  exchangeCode(code: string, now = new Date()): Promise<OAuthTokenGrant> {
    return this.tokens.exchangeCode(code, this.app.settings().ruName, now);
  }

  /** eBay wants the scopes again, and does not rotate refresh tokens. */
  refresh(credentials: ChannelCredentials, now = new Date()): Promise<ChannelCredentials> {
    return this.tokens.refresh(credentials, { scopes: EBAY_REQUIRED_SCOPES, now });
  }

  /** An application token (client credentials grant): the app acting for itself, not a user. */
  async requestApplicationToken(now = new Date()): Promise<EbayApplicationToken> {
    const token = await this.tokens.request({
      [OAuthParam.GrantType]: OAuthGrantType.ClientCredentials,
      [OAuthParam.Scope]: EBAY_APPLICATION_TOKEN_SCOPES.join(OAUTH_SCOPE_SEPARATOR),
    });
    return toEbayApplicationToken(token, now);
  }
}
