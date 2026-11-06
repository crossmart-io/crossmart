/** Better Auth serves sign-up, sign-in and sessions under this path (outside `/api/v1`). */
export const AUTH_BASE_PATH = '/api/auth';
export const AUTH_ROUTE_PATTERN = `${AUTH_BASE_PATH}/*splat`;
export const AUTH_APP_NAME = 'Crossmart';
export const MIN_PASSWORD_LENGTH = 10;
/** How long a password reset link works, in seconds. Stated in the email. */
export const PASSWORD_RESET_TTL_SECONDS = 60 * 60;

/**
 * Where the client's IP is, for rate limiting. Railway's edge sets it to the caller's address;
 * without it every visitor shares one rate-limit bucket.
 */
export const CLIENT_IP_HEADERS = ['x-real-ip'];

export const IS_PUBLIC_METADATA_KEY = 'crossmart:is-public';
export const ALLOWS_ANONYMOUS_METADATA_KEY = 'crossmart:allows-anonymous';
export const REQUIRED_PERMISSION_METADATA_KEY = 'crossmart:required-permission';

/** Route parameter that names the workspace a request acts on. */
export const WORKSPACE_ID_PARAM = 'workspaceId';

/** Web app pages of the agent OAuth flow (ADR 0019), relative to `WEB_APP_URL`. */
export const OAUTH_WEB_PAGES = {
  signIn: '/sign-in',
  /** Picks the workspace the agent will work in, before consent. */
  workspace: '/oauth/workspace',
  consent: '/oauth/consent',
} as const;

/** Better Auth's dynamic client registration endpoint, relative to the auth base path. */
export const OAUTH_REGISTER_PATH = '/oauth2/register';
/** Dynamic registrations allowed per client IP in one window. */
export const OAUTH_REGISTER_RATE_LIMIT = { window: 60 * 60, max: 20 } as const;
/** Only public clients (PKCE, no secret) may register without signing in. */
export const OAUTH_PUBLIC_CLIENT_AUTH_METHOD = 'none';
/** The grants agents use: the browser flow, then refresh. */
export const OAUTH_GRANT_TYPES = ['authorization_code', 'refresh_token'] as const;
/** The MCP profile of Client ID Metadata Documents that MCP clients follow. */
export const CIMD_METADATA_PROFILE = 'mcp-2026-07-28';

/**
 * Root discovery documents (RFC 8414 and OpenID Connect) for an issuer under the auth base path.
 * MCP clients look for them at the root, with the issuer's path appended or not.
 */
export const OAUTH_AUTHORIZATION_SERVER_METADATA_PATHS = [
  `/.well-known/oauth-authorization-server${AUTH_BASE_PATH}`,
  '/.well-known/oauth-authorization-server',
] as const;
export const OPENID_CONFIGURATION_PATHS = [
  `/.well-known/openid-configuration${AUTH_BASE_PATH}`,
  `${AUTH_BASE_PATH}/.well-known/openid-configuration`,
] as const;

/** How long the API keeps the agent token signing keys before reading them again. */
export const AGENT_TOKEN_KEYS_TTL_MS = 10 * 60 * 1000;
/** The access-token claims that may carry the OAuth client id, in order of preference. */
export const CLIENT_ID_CLAIMS = ['client_id', 'azp'] as const;
/** The access-token claim with the granted scopes. */
export const SCOPE_CLAIM = 'scope';
/** The header and scheme agent access tokens are sent with. */
export const AUTHORIZATION_HEADER = 'authorization';
export const BEARER_SCHEME = 'Bearer';
