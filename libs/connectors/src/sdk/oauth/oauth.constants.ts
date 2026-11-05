/** OAuth 2.0 request, callback and token parameters (RFC 6749, RFC 7009 for `token`). */
export enum OAuthParam {
  ClientId = 'client_id',
  ClientSecret = 'client_secret',
  ResponseType = 'response_type',
  RedirectUri = 'redirect_uri',
  Scope = 'scope',
  State = 'state',
  Code = 'code',
  Error = 'error',
  GrantType = 'grant_type',
  RefreshToken = 'refresh_token',
  Token = 'token',
}

export enum OAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
  ClientCredentials = 'client_credentials',
}

/**
 * How the app proves its identity to the token endpoint (RFC 6749 §2.3.1), named as in
 * RFC 7591: an HTTP Basic header (eBay), or the client id and secret in the form (Google).
 */
export enum OAuthClientAuthentication {
  HttpBasic = 'client_secret_basic',
  RequestBody = 'client_secret_post',
}

/** The authorization code grant's `response_type`. */
export const OAUTH_CODE_RESPONSE_TYPE = 'code';
/** Scopes are space-delimited (RFC 6749 §3.3). */
export const OAUTH_SCOPE_SEPARATOR = ' ';
/** The token error when a refresh token expired or was revoked (RFC 6749 §5.2). */
export const OAUTH_INVALID_GRANT_ERROR = 'invalid_grant';
