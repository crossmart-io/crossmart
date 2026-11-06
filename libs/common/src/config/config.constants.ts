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
/**
 * Ask Crossmart's questions answered per UTC day across the platform, whoever asks. Crossmart
 * pays for these calls, so the cap bounds the bill whatever the traffic; 0 turns Ask off.
 */
export const DEFAULT_ASK_DAILY_QUESTION_CAP = 1000;
/** Where Ask Crossmart sends people it cannot answer. */
export const DEFAULT_ASK_SUPPORT_EMAIL = 'hello@crossmart.io';
/** eBay's rule for the account deletion endpoint's verification token. */
export const EBAY_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;
