import type { ChannelFeature, ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionStatus } from '@crossmart/database';
import type { ConnectionSettings } from './connection-settings.js';
import type { PublishReadiness } from './publish-readiness.js';

/** A connection as the API shows it. It has no credentials field, by construction. */
export interface ChannelConnectionView {
  id: string;
  channel: ChannelType;
  externalAccountId: string;
  displayName: string;
  status: ChannelConnectionStatus;
  statusReason: string | null;
  grantedScopes: string[];
  /** What the connection cannot do until the merchant grants the optional scope it needs. */
  missingFeatures: ChannelFeature[];
  settings: ConnectionSettings;
  /** Whether listings can be published, and what the store's setup lacks when not. */
  publishReadiness: PublishReadiness;
  connectedAt: Date;
  disconnectedAt: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartedAuthorization {
  /** Where to send the merchant to approve the app. */
  authorizationUrl: string;
  /** The account the merchant named, normalized (`demo-store.myshopify.com`, `EBAY_US`). */
  accountHandle: string;
  /** @deprecated The same value as `accountHandle`, kept for existing API clients. */
  externalAccountId: string;
}

export interface AuthorizationRequest {
  channel: ChannelType;
  accountHandle: string;
}
