import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { encodeParams } from '../../sdk/http/form-encoding.js';
import { HttpTransport } from '../../sdk/http/http-transport.js';
import {
  OAUTH_CODE_RESPONSE_TYPE,
  OAuthClientAuthentication,
  OAuthParam,
  PKCE_S256_METHOD,
} from '../../sdk/oauth/oauth.constants.js';
import { OAuthTokenEndpoint } from '../../sdk/oauth/oauth-token-endpoint.js';
import type { OAuthTokenGrant } from '../../sdk/oauth/oauth-token-response.js';
import { pkceS256Challenge } from '../../sdk/oauth/pkce.js';
import {
  MERCADOLIBRE_API_BASE_URL,
  MERCADOLIBRE_AUTHORIZE_PATH,
  MERCADOLIBRE_REFRESH_TOKEN_LIFETIME_SECONDS,
  MERCADOLIBRE_TOKEN_PATH,
} from '../mercadolibre.constants.js';
import { MercadoLibreApp } from '../mercadolibre-app.js';
import { mercadoLibreError } from '../mercadolibre-errors.js';
import { MERCADOLIBRE_SITES, type MercadoLibreSiteId } from '../mercadolibre-site.js';

const EXCHANGE_FAILED = 'Mercado Libre did not issue an access token';
const REFRESH_REJECTED =
  'Mercado Libre no longer accepts this connection. Connect the Mercado Libre account again.';

/** What the authorize URL needs besides the app. */
export interface MercadoLibreAuthorizeParams {
  siteId: MercadoLibreSiteId;
  state: string;
  redirectUri: string;
  codeVerifier?: string;
}

/**
 * Mercado Libre's OAuth 2.0 authorization code grant: the sign-in URL on the seller's country
 * site, with a PKCE S256 challenge when Crossmart has a verifier; the code exchange and the
 * refresh, form-encoded with the App ID and Secret Key. Refresh tokens are single-use: each
 * refresh returns a new one, which replaces the stored one. Tokens never appear in errors.
 */
@Injectable()
export class MercadoLibreOAuthClient {
  private readonly tokens: OAuthTokenEndpoint;

  constructor(
    private readonly app: MercadoLibreApp,
    http: HttpTransport,
  ) {
    this.tokens = new OAuthTokenEndpoint(http, {
      tokenUrl: () => new URL(MERCADOLIBRE_TOKEN_PATH, MERCADOLIBRE_API_BASE_URL).toString(),
      client: () => this.app.settings(),
      clientAuthentication: OAuthClientAuthentication.RequestBody,
      error: mercadoLibreError,
      messages: { exchangeFailed: EXCHANGE_FAILED, refreshRejected: REFRESH_REJECTED },
      rotatesRefreshTokens: true,
      refreshTokenLifetimeSeconds: MERCADOLIBRE_REFRESH_TOKEN_LIFETIME_SECONDS,
    });
  }

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  authorizationUrl({ siteId, state, redirectUri, codeVerifier }: MercadoLibreAuthorizeParams): URL {
    const url = new URL(MERCADOLIBRE_AUTHORIZE_PATH, MERCADOLIBRE_SITES[siteId].authOrigin);
    url.search = encodeParams({
      [OAuthParam.ResponseType]: OAUTH_CODE_RESPONSE_TYPE,
      [OAuthParam.ClientId]: this.app.settings().clientId,
      [OAuthParam.RedirectUri]: redirectUri,
      [OAuthParam.State]: state,
      ...(codeVerifier
        ? {
            [OAuthParam.CodeChallenge]: pkceS256Challenge(codeVerifier),
            [OAuthParam.CodeChallengeMethod]: PKCE_S256_METHOD,
          }
        : {}),
    });
    return url;
  }

  exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
    now = new Date(),
  ): Promise<OAuthTokenGrant> {
    return this.tokens.exchangeCode(code, redirectUri, now, codeVerifier);
  }

  /** The new refresh token replaces the stored one: Mercado Libre accepts only the latest. */
  refresh(credentials: ChannelCredentials, now = new Date()): Promise<ChannelCredentials> {
    return this.tokens.refresh(credentials, { now });
  }
}
