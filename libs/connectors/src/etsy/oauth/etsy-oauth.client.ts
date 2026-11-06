import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { encodeParams } from '../../sdk/http/form-encoding.js';
import { HttpTransport } from '../../sdk/http/http-transport.js';
import {
  OAUTH_CODE_RESPONSE_TYPE,
  OAUTH_SCOPE_SEPARATOR,
  OAuthClientAuthentication,
  OAuthParam,
  PKCE_S256_METHOD,
} from '../../sdk/oauth/oauth.constants.js';
import { OAuthTokenEndpoint } from '../../sdk/oauth/oauth-token-endpoint.js';
import type { OAuthTokenGrant } from '../../sdk/oauth/oauth-token-response.js';
import { pkceS256Challenge } from '../../sdk/oauth/pkce.js';
import {
  ETSY_API_BASE_URL,
  ETSY_AUTHORIZE_URL,
  ETSY_REFRESH_TOKEN_LIFETIME_SECONDS,
  ETSY_REQUIRED_SCOPES,
  ETSY_TOKEN_PATH,
} from '../etsy.constants.js';
import { EtsyApp } from '../etsy-app.js';
import { etsyError } from '../etsy-errors.js';

const EXCHANGE_FAILED = 'Etsy did not issue an access token';
const REFRESH_REJECTED = 'Etsy no longer accepts this connection. Connect the Etsy shop again.';
const NO_VERIFIER = 'Etsy requires PKCE, and this connection has no code verifier';

/** What the authorize URL and the code exchange need besides the app. */
export interface EtsyAuthorizeParams {
  state: string;
  redirectUri: string;
  codeVerifier?: string;
}

/**
 * Etsy's OAuth 2.0 authorization code grant with PKCE: the sign-in URL with the S256 challenge,
 * the code exchange with the verifier, and the refresh. Etsy's token endpoint takes the
 * keystring as `client_id` and no secret. Refresh tokens rotate and live 90 days. Tokens never
 * appear in errors.
 */
@Injectable()
export class EtsyOAuthClient {
  private readonly tokens: OAuthTokenEndpoint;

  constructor(
    private readonly app: EtsyApp,
    http: HttpTransport,
  ) {
    this.tokens = new OAuthTokenEndpoint(http, {
      tokenUrl: () => new URL(ETSY_TOKEN_PATH, ETSY_API_BASE_URL).toString(),
      client: () => this.app.settings(),
      clientAuthentication: OAuthClientAuthentication.None,
      error: etsyError,
      messages: { exchangeFailed: EXCHANGE_FAILED, refreshRejected: REFRESH_REJECTED },
      rotatesRefreshTokens: true,
      refreshTokenLifetimeSeconds: ETSY_REFRESH_TOKEN_LIFETIME_SECONDS,
    });
  }

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  authorizationUrl({ state, redirectUri, codeVerifier }: EtsyAuthorizeParams): URL {
    const url = new URL(ETSY_AUTHORIZE_URL);
    url.search = encodeParams({
      [OAuthParam.ResponseType]: OAUTH_CODE_RESPONSE_TYPE,
      [OAuthParam.ClientId]: this.app.settings().clientId,
      [OAuthParam.RedirectUri]: redirectUri,
      [OAuthParam.Scope]: ETSY_REQUIRED_SCOPES.join(OAUTH_SCOPE_SEPARATOR),
      [OAuthParam.State]: state,
      [OAuthParam.CodeChallenge]: pkceS256Challenge(this.requireVerifier(codeVerifier)),
      [OAuthParam.CodeChallengeMethod]: PKCE_S256_METHOD,
    });
    return url;
  }

  exchangeCode(
    code: string,
    { redirectUri, codeVerifier }: Omit<EtsyAuthorizeParams, 'state'>,
    now = new Date(),
  ): Promise<OAuthTokenGrant> {
    return this.tokens.exchangeCode(code, redirectUri, now, this.requireVerifier(codeVerifier));
  }

  /** Etsy rotates the refresh token: the new one replaces the stored one. */
  refresh(credentials: ChannelCredentials, now = new Date()): Promise<ChannelCredentials> {
    return this.tokens.refresh(credentials, { now });
  }

  private requireVerifier(codeVerifier: string | undefined): string {
    if (!codeVerifier) {
      throw etsyError(ChannelErrorCode.RequestRejected, NO_VERIFIER);
    }
    return codeVerifier;
  }
}
