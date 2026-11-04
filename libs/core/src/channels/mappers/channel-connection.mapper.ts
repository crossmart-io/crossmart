import { requireEnumValue } from '@crossmart/common';
import { type ChannelConnector, ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import { parseConnectionSettings } from '../entities/connection-settings.js';
import type { ChannelConnectionRecord } from '../repositories/channel-connection.queries.js';

/** The API view of a stored connection. Settings are validated by the channel's connector. */
export function toChannelConnectionView(
  record: ChannelConnectionRecord,
  connector: ChannelConnector,
): ChannelConnectionView {
  return {
    id: record.id,
    channel: requireEnumValue(ChannelType, record.channel),
    externalAccountId: record.externalAccountId,
    displayName: record.displayName,
    status: record.status,
    statusReason: record.statusReason,
    grantedScopes: record.grantedScopes,
    settings: parseConnectionSettings(connector, record.settings),
    connectedAt: record.connectedAt,
    disconnectedAt: record.disconnectedAt,
    lastSyncedAt: record.lastSyncedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
