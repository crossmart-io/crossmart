import type { ChannelCredentials } from '../auth/channel-credentials.js';
import type { ChannelError } from '../errors/channel-error.js';
import { ChannelErrorCode } from '../errors/channel-error-code.enum.js';
import type { ChannelErrorFactory } from '../errors/channel-error-factory.js';
import { AUTHORIZATION_HEADER } from '../http/http.constants.js';
import { basicAuthorization } from '../http/authorization.js';
import { formPostRequest } from '../http/form-request.js';
import { isServerErrorStatus, isSuccessStatus } from '../http/http-status.js';
import type { HttpResponse, HttpTransport } from '../http/http-transport.js';
import { parseJsonBody } from '../http/parse-json.js';
import {
  OAUTH_INVALID_GRANT_ERROR,
  OAUTH_SCOPE_SEPARATOR,
  OAuthClientAuthentication,
  OAuthGrantType,
  OAuthParam,
} from './oauth.constants.js';
import { isRejectedGrantStatus } from './oauth-status.js';
import {
  type OAuthTokenGrant,
  type OAuthTokenResponse,
  grantedScopesOf,
  oauthErrorResponseSchema,
  oauthTokenResponseSchema,
  toChannelCredentials,
} from './oauth-token-response.js';

/** The app's credentials on the channel. */
export interface OAuthClientCredentials {
  clientId: string;
  clientSecret: string;
}

/** The merchant-readable messages of a channel's token errors. */
export interface OAuthTokenMessages {
  /** No token was issued: the endpoint failed, refused the grant, or answered nonsense. */
  exchangeFailed: string;
  /** The refresh token expired or was revoked: the merchant must connect again. */
  refreshRejected: string;
}

/** What a channel's token endpoint needs; URLs and credentials are read per call. */
export interface OAuthTokenEndpointOptions {
  tokenUrl(): string;
  client(): OAuthClientCredentials;
  clientAuthentication: OAuthClientAuthentication;
  error: ChannelErrorFactory;
  messages: OAuthTokenMessages;
}

export interface OAuthRefreshOptions {
  /** Sent as `scope` when the channel wants the scopes again on a refresh (eBay). */
  scopes?: readonly string[];
  now?: Date;
}

/**
 * An OAuth 2.0 token endpoint (RFC 6749): the code exchange, the refresh and other grants,
 * with the standard error handling. A 5xx is an outage; an `invalid_grant` on a refresh means
 * the merchant must connect again; anything else is a rejection naming the OAuth `error` code,
 * never the rest of the body. Tokens never appear in errors.
 */
export class OAuthTokenEndpoint {
  constructor(
    private readonly http: HttpTransport,
    private readonly options: OAuthTokenEndpointOptions,
  ) {}

  async exchangeCode(
    code: string,
    redirectUri: string,
    now = new Date(),
  ): Promise<OAuthTokenGrant> {
    const token = await this.request({
      [OAuthParam.GrantType]: OAuthGrantType.AuthorizationCode,
      [OAuthParam.Code]: code,
      [OAuthParam.RedirectUri]: redirectUri,
    });
    return { credentials: toChannelCredentials(token, now), grantedScopes: grantedScopesOf(token) };
  }

  /**
   * Exchanges the stored refresh token for a new access token. Refresh tokens are not rotated
   * (eBay, Google), so the stored one and its expiry are kept.
   */
  async refresh(
    credentials: ChannelCredentials,
    { scopes, now = new Date() }: OAuthRefreshOptions = {},
  ): Promise<ChannelCredentials> {
    const { refreshToken, refreshTokenExpiresAt } = credentials;
    if (!refreshToken) {
      throw this.refreshRejected();
    }
    const token = await this.request(
      {
        [OAuthParam.GrantType]: OAuthGrantType.RefreshToken,
        [OAuthParam.RefreshToken]: refreshToken,
        ...(scopes ? { [OAuthParam.Scope]: scopes.join(OAUTH_SCOPE_SEPARATOR) } : {}),
      },
      true,
    );
    return { ...toChannelCredentials(token, now), refreshToken, refreshTokenExpiresAt };
  }

  /** Any grant, such as client credentials; answers the validated token response. */
  async request(
    params: Readonly<Record<string, string>>,
    isRefresh = false,
  ): Promise<OAuthTokenResponse> {
    const response = await this.http.send(this.tokenRequest(params));
    if (!isSuccessStatus(response.status)) {
      throw this.tokenError(response, isRefresh);
    }
    const parsed = oauthTokenResponseSchema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw this.exchangeFailed(ChannelErrorCode.ChannelUnavailable);
    }
    return parsed.data;
  }

  private tokenRequest(
    params: Readonly<Record<string, string>>,
  ): ReturnType<typeof formPostRequest> {
    const { clientId, clientSecret } = this.options.client();
    const url = this.options.tokenUrl();
    if (this.options.clientAuthentication === OAuthClientAuthentication.HttpBasic) {
      return formPostRequest(url, params, {
        [AUTHORIZATION_HEADER]: basicAuthorization(clientId, clientSecret),
      });
    }
    return formPostRequest(url, {
      ...params,
      [OAuthParam.ClientId]: clientId,
      [OAuthParam.ClientSecret]: clientSecret,
    });
  }

  private tokenError(response: HttpResponse, isRefresh: boolean): ChannelError {
    if (isServerErrorStatus(response.status)) {
      return this.exchangeFailed(ChannelErrorCode.ChannelUnavailable);
    }
    const errorCode = this.errorCodeOf(response);
    if (
      isRefresh &&
      isRejectedGrantStatus(response.status) &&
      errorCode === OAUTH_INVALID_GRANT_ERROR
    ) {
      return this.refreshRejected();
    }
    return this.exchangeFailed(ChannelErrorCode.RequestRejected, errorCode);
  }

  /** The OAuth `error` code, such as `redirect_uri_mismatch`; never the rest of the body. */
  private errorCodeOf({ body }: HttpResponse): string | null {
    const parsed = oauthErrorResponseSchema.safeParse(parseJsonBody(body));
    return parsed.success ? parsed.data.error : null;
  }

  private exchangeFailed(code: ChannelErrorCode, reason: string | null = null): ChannelError {
    const { exchangeFailed } = this.options.messages;
    return this.options.error(code, reason ? `${exchangeFailed} (${reason})` : exchangeFailed);
  }

  private refreshRejected(): ChannelError {
    return this.options.error(
      ChannelErrorCode.CredentialsRejected,
      this.options.messages.refreshRejected,
    );
  }
}
