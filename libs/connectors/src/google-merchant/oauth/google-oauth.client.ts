import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { ChannelError } from '../../sdk/errors/channel-error.js';
import { encodeParams } from '../../sdk/http/form-encoding.js';
import {
  ACCEPT_HEADER,
  CONTENT_TYPE_HEADER,
  FORM_CONTENT_TYPE,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_UNAUTHORIZED,
  JSON_CONTENT_TYPE,
} from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isServerErrorStatus, isSuccessStatus } from '../../sdk/http/http-status.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import {
  GOOGLE_AUTHORIZE_URL,
  GOOGLE_CODE_RESPONSE_TYPE,
  GOOGLE_CONSENT_PROMPT,
  GOOGLE_INCLUDE_GRANTED_SCOPES,
  GOOGLE_INVALID_GRANT_ERROR,
  GOOGLE_OFFLINE_ACCESS,
  GOOGLE_REQUIRED_SCOPES,
  GOOGLE_REVOKE_URL,
  GOOGLE_SCOPE_SEPARATOR,
  GOOGLE_TOKEN_URL,
  GoogleGrantType,
  GoogleOAuthParam,
} from '../google-merchant.constants.js';
import { GoogleMerchantApp } from '../google-merchant-app.js';
import { googleMerchantError } from '../google-merchant-errors.js';
import {
  type GoogleTokenResponse,
  googleTokenErrorSchema,
  googleTokenResponseSchema,
} from './google-token-response.js';

const EXCHANGE_FAILED = 'Google did not issue an access token';
const REFRESH_REJECTED =
  'Google no longer accepts this connection. Connect the Merchant Center account again.';

/**
 * Google's authorization code grant for web server apps: the consent URL (offline, so a
 * refresh token is issued), the code exchange, the refresh and revocation. Tokens never appear
 * in errors or logs.
 */
@Injectable()
export class GoogleOAuthClient {
  constructor(
    private readonly app: GoogleMerchantApp,
    private readonly http: HttpTransport,
  ) {}

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  authorizationUrl(state: string, redirectUri: string): URL {
    const url = new URL(GOOGLE_AUTHORIZE_URL);
    url.search = encodeParams({
      [GoogleOAuthParam.ClientId]: this.app.settings().clientId,
      [GoogleOAuthParam.RedirectUri]: redirectUri,
      [GoogleOAuthParam.ResponseType]: GOOGLE_CODE_RESPONSE_TYPE,
      [GoogleOAuthParam.Scope]: GOOGLE_REQUIRED_SCOPES.join(GOOGLE_SCOPE_SEPARATOR),
      [GoogleOAuthParam.AccessType]: GOOGLE_OFFLINE_ACCESS,
      [GoogleOAuthParam.Prompt]: GOOGLE_CONSENT_PROMPT,
      [GoogleOAuthParam.IncludeGrantedScopes]: GOOGLE_INCLUDE_GRANTED_SCOPES,
      [GoogleOAuthParam.State]: state,
    });
    return url;
  }

  /** Exchanges the callback's code; the response also lists the scopes the merchant granted. */
  async exchangeCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
    const { clientId, clientSecret } = this.app.settings();
    const response = await this.post(GOOGLE_TOKEN_URL, {
      [GoogleOAuthParam.GrantType]: GoogleGrantType.AuthorizationCode,
      [GoogleOAuthParam.Code]: code,
      [GoogleOAuthParam.RedirectUri]: redirectUri,
      [GoogleOAuthParam.ClientId]: clientId,
      [GoogleOAuthParam.ClientSecret]: clientSecret,
    });
    return this.parseTokenResponse(response, false);
  }

  /** Google does not rotate refresh tokens, so the stored one and its expiry are kept. */
  async refresh(credentials: ChannelCredentials): Promise<GoogleTokenResponse> {
    if (!credentials.refreshToken) {
      throw googleMerchantError(ChannelErrorCode.CredentialsRejected, REFRESH_REJECTED);
    }
    const { clientId, clientSecret } = this.app.settings();
    const response = await this.post(GOOGLE_TOKEN_URL, {
      [GoogleOAuthParam.GrantType]: GoogleGrantType.RefreshToken,
      [GoogleOAuthParam.RefreshToken]: credentials.refreshToken,
      [GoogleOAuthParam.ClientId]: clientId,
      [GoogleOAuthParam.ClientSecret]: clientSecret,
    });
    return this.parseTokenResponse(response, true);
  }

  /** Revokes the grant. A token Google no longer knows is already revoked. */
  async revoke(token: string): Promise<void> {
    const response = await this.post(GOOGLE_REVOKE_URL, { [GoogleOAuthParam.Token]: token });
    if (isServerErrorStatus(response.status)) {
      throw googleMerchantError(ChannelErrorCode.ChannelUnavailable, 'Google is not responding');
    }
  }

  private post(url: string, params: Record<string, string>): Promise<HttpResponse> {
    return this.http.send({
      method: HttpMethod.Post,
      url,
      headers: { [CONTENT_TYPE_HEADER]: FORM_CONTENT_TYPE, [ACCEPT_HEADER]: JSON_CONTENT_TYPE },
      body: encodeParams(params),
    });
  }

  private parseTokenResponse(response: HttpResponse, isRefresh: boolean): GoogleTokenResponse {
    if (!isSuccessStatus(response.status)) {
      throw this.tokenError(response, isRefresh);
    }
    const parsed = googleTokenResponseSchema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw googleMerchantError(ChannelErrorCode.ChannelUnavailable, EXCHANGE_FAILED);
    }
    return parsed.data;
  }

  private tokenError(response: HttpResponse, isRefresh: boolean): ChannelError {
    if (isServerErrorStatus(response.status)) {
      return googleMerchantError(ChannelErrorCode.ChannelUnavailable, EXCHANGE_FAILED);
    }
    if (isRefresh && this.isInvalidGrant(response)) {
      return googleMerchantError(ChannelErrorCode.CredentialsRejected, REFRESH_REJECTED);
    }
    const reason = this.errorCodeOf(response);
    const message = reason ? `${EXCHANGE_FAILED} (${reason})` : EXCHANGE_FAILED;
    return googleMerchantError(ChannelErrorCode.RequestRejected, message);
  }

  /** Google's OAuth error code, such as `redirect_uri_mismatch`; never the rest of the body. */
  private errorCodeOf({ body }: HttpResponse): string | null {
    const parsed = googleTokenErrorSchema.safeParse(parseJsonBody(body));
    return parsed.success ? parsed.data.error : null;
  }

  /** A 400 or 401 `invalid_grant`: the refresh token expired or the merchant revoked access. */
  private isInvalidGrant(response: HttpResponse): boolean {
    const { status } = response;
    const rejected = status === HTTP_STATUS_BAD_REQUEST || status === HTTP_STATUS_UNAUTHORIZED;
    return rejected && this.errorCodeOf(response) === GOOGLE_INVALID_GRANT_ERROR;
  }
}
