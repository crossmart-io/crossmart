export const CHANNELS_TAG = 'Channels';
export const CHANNEL_CONNECTIONS_ROUTE = 'workspaces/:workspaceId/channel-connections';
export const CONNECTION_ID_PARAM = 'connectionId';
export const AUTHORIZATIONS_PATH = 'authorizations';
export const DISCONNECT_PATH = `:${CONNECTION_ID_PARAM}/disconnect`;

/** Called by channels, not by API clients, so they are left out of the OpenAPI spec. */
export const CHANNEL_PARAM = 'channel';
export const OAUTH_CALLBACK_ROUTE = `channels/:${CHANNEL_PARAM}/oauth/callback`;
export const WEBHOOKS_ROUTE = `webhooks/:${CHANNEL_PARAM}`;
/**
 * eBay's marketplace account deletion endpoint. It must stay in step with core's
 * `EBAY_ACCOUNT_DELETION_PATH`, the URL eBay hashes into its challenge.
 */
export const EBAY_ACCOUNT_DELETION_ROUTE = 'webhooks/ebay/account-deletion';
/** Longer challenge codes than this are refused; eBay's are short random strings. */
export const EBAY_CHALLENGE_CODE_MAX_LENGTH = 512;

/** Where the OAuth callback sends the merchant: the web app's Channels page. */
export const WEB_CHANNELS_PATH = '/channels';
export enum ChannelsPageQuery {
  /** The channel that was connected. */
  Connected = 'connected',
  /** A `ConnectFailure` value. */
  Error = 'error',
  /** The channel the error is about. */
  Channel = 'channel',
}

export const ACCOUNT_HANDLE_MAX_LENGTH = 255;

/** Schema names the generated web client uses for the channel enums. */
export const CHANNEL_TYPE_SCHEMA_NAME = 'ChannelType';
export const CHANNEL_FEATURE_SCHEMA_NAME = 'ChannelFeature';
export const CHANNEL_CONNECTION_STATUS_SCHEMA_NAME = 'ChannelConnectionStatus';
export const PUBLISH_REQUIREMENT_SCHEMA_NAME = 'PublishRequirement';
export const CONNECT_FAILURE_SCHEMA_NAME = 'ConnectFailure';
export const EBAY_MARKETPLACE_ID_SCHEMA_NAME = 'EbayMarketplaceId';
/** Imports of a connection's catalog, under the connection. */
export const CHANNEL_IMPORTS_PATH = `:${CONNECTION_ID_PARAM}/imports`;
/** eBay-only setup of a connection, under the connection. */
export const EBAY_LISTING_DEFAULTS_PATH = `:${CONNECTION_ID_PARAM}/ebay/listing-defaults`;
export const EBAY_POLICIES_OPT_IN_PATH = `:${CONNECTION_ID_PARAM}/ebay/business-policies/opt-in`;
export const EBAY_POLICIES_REFRESH_PATH = `:${CONNECTION_ID_PARAM}/ebay/business-policies/refresh`;
export const EBAY_POLICIES_DEFAULTS_PATH = `:${CONNECTION_ID_PARAM}/ebay/business-policies/defaults`;
export const EBAY_CONDITION_SCHEMA_NAME = 'EbayCondition';
export const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
export const POSTAL_CODE_MAX_LENGTH = 32;
export const CITY_MAX_LENGTH = 128;
export const POLICY_ID_MAX_LENGTH = 64;
/** Google Merchant Center setup of a connection, under the connection. */
export const GOOGLE_LISTING_SETUP_PATH = `:${CONNECTION_ID_PARAM}/google-merchant/listing-setup`;
export const GOOGLE_TARGET_COUNTRY_SCHEMA_NAME = 'GoogleTargetCountry';
/** Longest product page address template accepted. */
export const PRODUCT_URL_TEMPLATE_MAX_LENGTH = 2_000;
