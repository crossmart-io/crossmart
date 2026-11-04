export const CHANNELS_TAG = 'Channels';
export const CHANNEL_CONNECTIONS_ROUTE = 'workspaces/:workspaceId/channel-connections';
export const CONNECTION_ID_PARAM = 'connectionId';
export const AUTHORIZATIONS_PATH = 'authorizations';
export const DISCONNECT_PATH = `:${CONNECTION_ID_PARAM}/disconnect`;

/** Called by channels, not by API clients, so they are left out of the OpenAPI spec. */
export const CHANNEL_PARAM = 'channel';
export const OAUTH_CALLBACK_ROUTE = `channels/:${CHANNEL_PARAM}/oauth/callback`;
export const WEBHOOKS_ROUTE = `webhooks/:${CHANNEL_PARAM}`;

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
export const CONNECT_FAILURE_SCHEMA_NAME = 'ConnectFailure';
export const EBAY_MARKETPLACE_ID_SCHEMA_NAME = 'EbayMarketplaceId';
/** Imports of a connection's catalog, under the connection. */
export const CHANNEL_IMPORTS_PATH = `:${CONNECTION_ID_PARAM}/imports`;
