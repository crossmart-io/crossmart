import { requireEnumValue } from '@crossmart/common';
import { type ChannelConnector, type ChannelFeature, ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import { parseConnectionSettings } from '../entities/connection-settings.js';
import type { ChannelConnectionRecord } from '../repositories/channel-connection.queries.js';
import { publishReadinessOf } from '../rules/publish-readiness.js';

/** Features whose optional scope the merchant has not granted. */
function missingFeaturesOf(
  connector: ChannelConnector,
  grantedScopes: readonly string[],
): ChannelFeature[] {
  return (connector.optionalScopes ?? [])
    .filter(({ scope }) => !grantedScopes.includes(scope))
    .map(({ feature }) => feature);
}

/** The API view of a stored connection. Settings are validated by the channel's connector. */
export function toChannelConnectionView(
  record: ChannelConnectionRecord,
  connector: ChannelConnector,
): ChannelConnectionView {
  const settings = parseConnectionSettings(connector, record.settings);
  return {
    id: record.id,
    channel: requireEnumValue(ChannelType, record.channel),
    externalAccountId: record.externalAccountId,
    displayName: record.displayName,
    status: record.status,
    statusReason: record.statusReason,
    grantedScopes: record.grantedScopes,
    missingFeatures: missingFeaturesOf(connector, record.grantedScopes),
    settings,
    publishReadiness: publishReadinessOf(connector, record.status, settings.account),
    connectedAt: record.connectedAt,
    disconnectedAt: record.disconnectedAt,
    lastSyncedAt: record.lastSyncedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
