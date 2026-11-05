/** How long a merchant has to approve the app on the channel before the state expires. */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
/** HKDF info that derives the state-signing key from the auth secret. */
export const OAUTH_STATE_KEY_INFO = 'crossmart:channel-oauth-state';
export const OAUTH_STATE_KEY_BYTES = 32;
export const OAUTH_STATE_NONCE_BYTES = 16;
export const OAUTH_STATE_SEPARATOR = '.';
/** Prefix of the replay keys that make each OAuth state single use. */
export const OAUTH_STATE_REPLAY_KEY_PREFIX = 'channel-oauth-state:';

/** Prefix of the replay keys that remember channel webhook deliveries by id. */
export const WEBHOOK_DELIVERY_REPLAY_KEY_PREFIX = 'channel-webhook:';
/**
 * How long a webhook delivery id is remembered, so a repeat is acknowledged without being
 * handled again. Longer than any connector accepts a delivery for (Shopify: 6 hours).
 */
export const WEBHOOK_DELIVERY_TTL_MS = 24 * 60 * 60 * 1000;

/** Tokens are refreshed this long before they expire, so a call never starts with a dead token. */
export const CREDENTIALS_REFRESH_MARGIN_MS = 5 * 60 * 1000;

/** Binds sealed credentials to their connection: `channel-connection:<channel>:<account>`. */
export const CREDENTIALS_CONTEXT_PREFIX = 'channel-connection';
export const CREDENTIALS_CONTEXT_SEPARATOR = ':';

/** Where channels send the merchant back to, under the API's public URL. */
export const CHANNEL_OAUTH_CALLBACK_PATH = '/api/v1/channels/:channel/oauth/callback';
export const CHANNEL_PATH_PARAM = ':channel';

/**
 * eBay's marketplace account deletion endpoint, under the API's public URL. eBay hashes this
 * exact URL into its challenge, so it must match the one registered in the developer portal.
 */
export const EBAY_ACCOUNT_DELETION_PATH = '/api/v1/webhooks/ebay/account-deletion';
/** Names a connection whose eBay user deleted their account; the username is erased. */
export const EBAY_DELETED_ACCOUNT_NAME = 'Deleted eBay account';

export const CONNECTION_NOT_FOUND = 'Channel connection not found';
export const STATUS_REASON_MAX_LENGTH = 500;
export const PRODUCT_SELECTION_MAX_IDS = 10_000;
export const PRODUCT_SELECTION_TEXT_MAX_LENGTH = 200;
export const PRODUCT_SELECTION_MAX_TAGS = 50;

/** Pricing rule bounds: a cut of more than 90% or a markup of more than 500% is a typo. */
export const PRICING_MIN_PERCENT = -90;
export const PRICING_MAX_PERCENT = 500;
export const PRICING_MAX_FIXED_AMOUNT = 100_000;
export const PRICING_MAX_MARGIN_PERCENT = 1000;
/** Prices are stored with two fraction digits, whatever the currency allows. */
export const PRICE_MAX_FRACTION_DIGITS = 2;
/** The currency of a connection whose channel does not report one. */
export const DEFAULT_CURRENCY_CODE = 'USD';
