/** Better Auth serves sign-up, sign-in and sessions under this path (outside `/api/v1`). */
export const AUTH_BASE_PATH = '/api/auth';
export const AUTH_ROUTE_PATTERN = `${AUTH_BASE_PATH}/*splat`;
export const AUTH_APP_NAME = 'Crossmart';
export const MIN_PASSWORD_LENGTH = 10;

export const IS_PUBLIC_METADATA_KEY = 'crossmart:is-public';
export const REQUIRED_PERMISSION_METADATA_KEY = 'crossmart:required-permission';

/** Route parameter that names the workspace a request acts on. */
export const WORKSPACE_ID_PARAM = 'workspaceId';
