export const DEFAULT_API_PORT = 3000;
export const MIN_PORT = 1;
export const MAX_PORT = 65535;

export const CORS_ORIGINS_SEPARATOR = ',';
export const MIN_AUTH_SECRET_LENGTH = 32;

export const DEFAULT_STORAGE_LOCAL_DIR = 'storage';
export const DEFAULT_MEDIA_PUBLIC_URL = 'http://localhost:3000/media';

export const DEFAULT_WEB_APP_URL = 'http://localhost:5173';
export const DEFAULT_MASTER_KEY_VERSION = 1;
export const MIN_MASTER_KEY_VERSION = 1;

/** How a boolean environment variable reads as true; anything else is false. */
export const ENV_TRUE = 'true';
/** Plan limits are reported but not enforced until billing exists. */
export const DEFAULT_ENTITLEMENTS_ENFORCED = false;
/** The model the AI agents use unless `AI_MODEL` names another. */
export const DEFAULT_AI_MODEL = 'claude-sonnet-5-5';
