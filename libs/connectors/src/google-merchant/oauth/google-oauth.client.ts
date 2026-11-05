import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { encodeParams } from '../../sdk/http/form-encoding.js';
import { formPostRequest } from '../../sdk/http/form-request.js';
import { isServerErrorStatus } from '../../sdk/http/http-status.js';
import { HttpTransport } from '../../sdk/http/http-transport.js';
import {
  OAUTH_CODE_RESPONSE_TYPE,
  OAUTH_SCOPE_SEPARATOR,
  OAuthClientAuthentication,
  OAuthParam,
} from '../../sdk/oauth/oauth.constants.js';
import { OAuthTokenEndpoint } from '../../sdk/oauth/oauth-token-endpoint.js';
import type { OAuthTokenGrant } from '../../sdk/oauth/oauth-token-response.js';
import {
  GOOGLE_AUTHORIZE_URL,
  GOOGLE_CONSENT_PROMPT,
  GOOGLE_INCLUDE_GRANTED_SCOPES,
  GOOGLE_OFFLINE_ACCESS,
  GOOGLE_REQUIRED_SCOPES,
  GOOGLE_REVOKE_URL,
  GOOGLE_TOKEN_URL,
  GoogleOAuthParam,
} from '../google-merchant.constants.js';
import { GoogleMerchantApp } from '../google-merchant-app.js';
import { googleMerchantError } from '../google-merchant-errors.js';

const EXCHANGE_FAILED = 'Google did not issue an access token';
const REFRESH_REJECTED =
  'Google no longer accepts this connection. Connect the Merchant Center account again.';
const REVOKE_FAILED = 'Google is not responding';

/**
 * Google's authorization code grant for web server apps: the consent URL (offline, so a
 * refresh token is issued), the code exchange, the refresh and revocation. The app's
 * credentials go in the form body. Tokens never appear in errors or logs.
 */
@Injectable()
export class GoogleOAuthClient {
  private readonly tokens: OAuthTokenEndpoint;

  constructor(
    private readonly app: GoogleMerchantApp,
    private readonly http: HttpTransport,
  ) {
    this.tokens = new OAuthTokenEndpoint(http, {
      tokenUrl: () => GOOGLE_TOKEN_URL,
      client: () => this.app.settings(),
      clientAuthentication: OAuthClientAuthentication.RequestBody,
      error: googleMerchantError,
      messages: { exchangeFailed: EXCHANGE_FAILED, refreshRejected: REFRESH_REJECTED },
    });
  }

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  authorizationUrl(state: string, redirectUri: string): URL {
    const url = new URL(GOOGLE_AUTHORIZE_URL);
    url.search = encodeParams({
      [OAuthParam.ClientId]: this.app.settings().clientId,
      [OAuthParam.RedirectUri]: redirectUri,
      [OAuthParam.ResponseType]: OAUTH_CODE_RESPONSE_TYPE,
      [OAuthParam.Scope]: GOOGLE_REQUIRED_SCOPES.join(OAUTH_SCOPE_SEPARATOR),
      [GoogleOAuthParam.AccessType]: GOOGLE_OFFLINE_ACCESS,
      [GoogleOAuthParam.Prompt]: GOOGLE_CONSENT_PROMPT,
      [GoogleOAuthParam.IncludeGrantedScopes]: GOOGLE_INCLUDE_GRANTED_SCOPES,
      [OAuthParam.State]: state,
    });
    return url;
  }

  /** Exchanges the callback's code; Google also lists the scopes the merchant granted. */
  exchangeCode(code: string, redirectUri: string, now = new Date()): Promise<OAuthTokenGrant> {
    return this.tokens.exchangeCode(code, redirectUri, now);
  }

  /** Google does not rotate refresh tokens, so the stored one and its expiry are kept. */
  refresh(credentials: ChannelCredentials, now = new Date()): Promise<ChannelCredentials> {
    return this.tokens.refresh(credentials, { now });
  }

  /** Revokes the grant. A token Google no longer knows is already revoked. */
  async revoke(token: string): Promise<void> {
    const response = await this.http.send(
      formPostRequest(GOOGLE_REVOKE_URL, { [OAuthParam.Token]: token }),
    );
    if (isServerErrorStatus(response.status)) {
      throw googleMerchantError(ChannelErrorCode.ChannelUnavailable, REVOKE_FAILED);
    }
  }
}
