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
  /** PKCE (RFC 7636): the challenge and its method on the authorize URL, the verifier with the code. */
  CodeChallenge = 'code_challenge',
  CodeChallengeMethod = 'code_challenge_method',
  CodeVerifier = 'code_verifier',
}

export enum OAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
  ClientCredentials = 'client_credentials',
}

/**
 * How the app proves its identity to the token endpoint (RFC 6749 §2.3.1), named as in
 * RFC 7591: an HTTP Basic header (eBay), the client id and secret in the form (Google), or the
 * client id alone for a public client (Etsy).
 */
export enum OAuthClientAuthentication {
  HttpBasic = 'client_secret_basic',
  RequestBody = 'client_secret_post',
  /** A public client: only `client_id` in the form, proven by PKCE instead of a secret (Etsy). */
  None = 'none',
}

/** The authorization code grant's `response_type`. */
export const OAUTH_CODE_RESPONSE_TYPE = 'code';
/** Scopes are space-delimited (RFC 6749 §3.3). */
export const OAUTH_SCOPE_SEPARATOR = ' ';
/** The token error when a refresh token expired or was revoked (RFC 6749 §5.2). */
export const OAUTH_INVALID_GRANT_ERROR = 'invalid_grant';
/** The only PKCE challenge method Crossmart uses: SHA-256 of the verifier (RFC 7636 §4.2). */
export const PKCE_S256_METHOD = 'S256';
