import { REDIS_KEY_PREFIX } from '@crossmart/common';

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
/**
 * Better Auth's rate-limit windows in Redis, shared by every API instance:
 * `crossmart:auth-rate-limit:<client IP>|<path>`.
 */
export const AUTH_RATE_LIMIT_KEY_PREFIX = `${REDIS_KEY_PREFIX}auth-rate-limit:`;
/** Separates the client IP from the path in Better Auth's rate-limit keys (`<ip>|<path>`). */
export const AUTH_RATE_LIMIT_KEY_SEPARATOR = '|';
/** How long a rate-limit check waits for Redis before it falls back, so sign-in never hangs. */
export const AUTH_RATE_LIMIT_REDIS_TIMEOUT_MS = 250;
/**
 * Paths refused while Redis is unavailable, rather than counted per instance: anyone can call
 * them without signing in, and each success leaves a lasting record (a registered client).
 */
export const AUTH_RATE_LIMIT_FAIL_CLOSED_PATHS: readonly string[] = [OAUTH_REGISTER_PATH];
/** The `Retry-After` of a request refused because the shared limits could not be checked. */
export const AUTH_RATE_LIMIT_UNAVAILABLE_RETRY_AFTER_SECONDS = 60;
/** At most this many per-instance fallback windows are kept, so an outage cannot exhaust memory. */
export const AUTH_RATE_LIMIT_LOCAL_MAX_WINDOWS = 10_000;

/** Only public clients (PKCE, no secret) may register without signing in. */
export const OAUTH_PUBLIC_CLIENT_AUTH_METHOD = 'none';
/** The grants agents use: the browser flow, then refresh. */
export const OAUTH_GRANT_TYPES = ['authorization_code', 'refresh_token'] as const;
/** The MCP profile of Client ID Metadata Documents that MCP clients follow. */
export const CIMD_METADATA_PROFILE = 'mcp-2026-07-28';

/**
 * Discovery documents (RFC 8414 and OpenID Connect) for an issuer under the auth base path.
 * MCP clients look for them at the root, with the issuer's path appended or not; others append
 * the well-known path to the issuer. Every copy of the RFC 8414 one carries auth.md's
 * `agent_auth` block.
 */
export const OAUTH_AUTHORIZATION_SERVER_METADATA_PATHS = [
  `/.well-known/oauth-authorization-server${AUTH_BASE_PATH}`,
  '/.well-known/oauth-authorization-server',
  `${AUTH_BASE_PATH}/.well-known/oauth-authorization-server`,
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
/** The header a 401 names its challenge in (RFC 9110 §11.6.1). */
export const WWW_AUTHENTICATE_HEADER = 'WWW-Authenticate';
/** The header and scheme agent access tokens are sent with. */
export const AUTHORIZATION_HEADER = 'authorization';
export const BEARER_SCHEME = 'Bearer';
