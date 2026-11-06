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
