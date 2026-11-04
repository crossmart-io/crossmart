import type { ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionStatus } from '@crossmart/database';
import type { ConnectionSettings } from './connection-settings.js';

/** A connection as the API shows it. It has no credentials field, by construction. */
export interface ChannelConnectionView {
  id: string;
  channel: ChannelType;
  externalAccountId: string;
  displayName: string;
  status: ChannelConnectionStatus;
  statusReason: string | null;
  grantedScopes: string[];
  settings: ConnectionSettings;
  connectedAt: Date;
  disconnectedAt: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartedAuthorization {
  /** Where to send the merchant to approve the app. */
  authorizationUrl: string;
  /** The account the merchant named, normalized (`demo-store.myshopify.com`). */
  externalAccountId: string;
}

export interface AuthorizationRequest {
  channel: ChannelType;
  accountHandle: string;
}
