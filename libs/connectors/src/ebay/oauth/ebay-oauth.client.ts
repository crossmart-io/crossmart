import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { ChannelError } from '../../sdk/errors/channel-error.js';
import { encodeParams } from '../../sdk/http/form-encoding.js';
import {
  ACCEPT_HEADER,
  AUTHORIZATION_HEADER,
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
  BASIC_AUTH_SCHEME,
  BASIC_CREDENTIALS_SEPARATOR,
  EBAY_APPLICATION_TOKEN_SCOPES,
  EBAY_AUTHORIZE_PATH,
  EBAY_CODE_RESPONSE_TYPE,
  EBAY_INVALID_GRANT_ERROR,
  EBAY_REQUIRED_SCOPES,
  EBAY_SCOPE_SEPARATOR,
  EBAY_TOKEN_PATH,
  EbayGrantType,
  EbayOAuthParam,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { ebayError } from '../ebay-errors.js';
import {
  type EbayApplicationToken,
  type EbayTokenResponse,
  ebayTokenErrorSchema,
  ebayTokenResponseSchema,
  toEbayApplicationToken,
  toEbayCredentials,
} from './ebay-token-response.js';

const BASE64 = 'base64';
const EXCHANGE_FAILED = 'eBay did not issue an access token';
const REFRESH_REJECTED = 'eBay no longer accepts this connection. Connect the eBay account again.';

/**
 * eBay's authorization code grant: the sign-in URL, the code exchange and the refresh. eBay
 * takes the app's RuName where OAuth expects the redirect URL. Tokens never appear in errors.
 */
@Injectable()
export class EbayOAuthClient {
  constructor(
    private readonly app: EbayApp,
    private readonly http: HttpTransport,
  ) {}

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  authorizationUrl(state: string): URL {
    const { clientId, ruName } = this.app.settings();
    const url = new URL(EBAY_AUTHORIZE_PATH, this.app.hosts().auth);
    url.search = encodeParams({
      [EbayOAuthParam.ClientId]: clientId,
      [EbayOAuthParam.ResponseType]: EBAY_CODE_RESPONSE_TYPE,
      [EbayOAuthParam.RedirectUri]: ruName,
      [EbayOAuthParam.Scope]: EBAY_REQUIRED_SCOPES.join(EBAY_SCOPE_SEPARATOR),
      [EbayOAuthParam.State]: state,
    });
    return url;
  }

  async exchangeCode(code: string, now = new Date()): Promise<ChannelCredentials> {
    const response = await this.requestToken({
      [EbayOAuthParam.GrantType]: EbayGrantType.AuthorizationCode,
      [EbayOAuthParam.Code]: code,
      [EbayOAuthParam.RedirectUri]: this.app.settings().ruName,
    });
    return toEbayCredentials(this.parseTokenResponse(response, false), now);
  }

  /** eBay does not rotate refresh tokens, so the stored one and its expiry are kept. */
  async refresh(credentials: ChannelCredentials, now = new Date()): Promise<ChannelCredentials> {
    const { refreshToken, refreshTokenExpiresAt } = credentials;
    if (!refreshToken) {
      throw ebayError(ChannelErrorCode.CredentialsRejected, REFRESH_REJECTED);
    }
    const response = await this.requestToken({
      [EbayOAuthParam.GrantType]: EbayGrantType.RefreshToken,
      [EbayOAuthParam.RefreshToken]: refreshToken,
      [EbayOAuthParam.Scope]: EBAY_REQUIRED_SCOPES.join(EBAY_SCOPE_SEPARATOR),
    });
    const refreshed = toEbayCredentials(this.parseTokenResponse(response, true), now);
    return { ...refreshed, refreshToken, refreshTokenExpiresAt };
  }

  /** An application token (client credentials grant): the app acting for itself, not a user. */
  async requestApplicationToken(now = new Date()): Promise<EbayApplicationToken> {
    const response = await this.requestToken({
      [EbayOAuthParam.GrantType]: EbayGrantType.ClientCredentials,
      [EbayOAuthParam.Scope]: EBAY_APPLICATION_TOKEN_SCOPES.join(EBAY_SCOPE_SEPARATOR),
    });
    return toEbayApplicationToken(this.parseTokenResponse(response, false), now);
  }

  private async requestToken(grant: Record<string, string>): Promise<HttpResponse> {
    return this.http.send({
      method: HttpMethod.Post,
      url: new URL(EBAY_TOKEN_PATH, this.app.hosts().api).toString(),
      headers: {
        [AUTHORIZATION_HEADER]: this.basicAuthorization(),
        [CONTENT_TYPE_HEADER]: FORM_CONTENT_TYPE,
        [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
      },
      body: encodeParams(grant),
    });
  }

  private basicAuthorization(): string {
    const { clientId, clientSecret } = this.app.settings();
    const pair = `${clientId}${BASIC_CREDENTIALS_SEPARATOR}${clientSecret}`;
    return `${BASIC_AUTH_SCHEME} ${Buffer.from(pair).toString(BASE64)}`;
  }

  private parseTokenResponse(response: HttpResponse, isRefresh: boolean): EbayTokenResponse {
    if (!isSuccessStatus(response.status)) {
      throw this.tokenError(response, isRefresh);
    }
    const parsed = ebayTokenResponseSchema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw ebayError(ChannelErrorCode.ChannelUnavailable, EXCHANGE_FAILED);
    }
    return parsed.data;
  }

  private tokenError(response: HttpResponse, isRefresh: boolean): ChannelError {
    if (isServerErrorStatus(response.status)) {
      return ebayError(ChannelErrorCode.ChannelUnavailable, EXCHANGE_FAILED);
    }
    return isRefresh && this.isInvalidGrant(response)
      ? ebayError(ChannelErrorCode.CredentialsRejected, REFRESH_REJECTED)
      : ebayError(ChannelErrorCode.RequestRejected, EXCHANGE_FAILED);
  }

  /** A 400 or 401 `invalid_grant`: the refresh token expired or the merchant revoked access. */
  private isInvalidGrant({ status, body }: HttpResponse): boolean {
    const rejected = status === HTTP_STATUS_BAD_REQUEST || status === HTTP_STATUS_UNAUTHORIZED;
    const parsed = ebayTokenErrorSchema.safeParse(parseJsonBody(body));
    return rejected && parsed.success && parsed.data.error === EBAY_INVALID_GRANT_ERROR;
  }
}
