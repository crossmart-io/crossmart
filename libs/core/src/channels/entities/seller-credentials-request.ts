import type { ChannelType } from '@crossmart/connectors';

/** A merchant connecting a channel with the keys it issued them, as the API received them. */
export interface SellerCredentialsRequest {
  channel: ChannelType;
  /** The values by field key; checked against the connector's fields before use. */
  credentials: Readonly<Record<string, unknown>>;
}
