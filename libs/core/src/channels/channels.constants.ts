/** How long a merchant has to approve the app on the channel before the state expires. */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
/** HKDF info that derives the state-signing key from the auth secret. */
export const OAUTH_STATE_KEY_INFO = 'crossmart:channel-oauth-state';
export const OAUTH_STATE_KEY_BYTES = 32;
export const OAUTH_STATE_NONCE_BYTES = 16;
export const OAUTH_STATE_SEPARATOR = '.';

/** Tokens are refreshed this long before they expire, so a call never starts with a dead token. */
export const CREDENTIALS_REFRESH_MARGIN_MS = 5 * 60 * 1000;

/** Binds sealed credentials to their connection: `channel-connection:<channel>:<account>`. */
export const CREDENTIALS_CONTEXT_PREFIX = 'channel-connection';
export const CREDENTIALS_CONTEXT_SEPARATOR = ':';

/** Where channels send the merchant back to, under the API's public URL. */
export const CHANNEL_OAUTH_CALLBACK_PATH = '/api/v1/channels/:channel/oauth/callback';
export const CHANNEL_PATH_PARAM = ':channel';

export const CONNECTION_NOT_FOUND = 'Channel connection not found';
export const STATUS_REASON_MAX_LENGTH = 500;
export const PRODUCT_SELECTION_MAX_IDS = 10_000;
export const PRODUCT_SELECTION_TEXT_MAX_LENGTH = 200;
export const PRODUCT_SELECTION_MAX_TAGS = 50;
