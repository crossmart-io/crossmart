import { ChannelConnectionStatus } from '@crossmart/database';
import type { ChannelConnectionRecord } from '../repositories/channel-connection.queries.js';
import { FAKE_ACCOUNT } from './fake-oauth-connector.js';

export const WORKSPACE_ID = '0b6c1d4e-7f0a-4c55-9a39-3c1f4b7e9d01';
export const USER_ID = '5a0e7c3b-2d1f-4e8a-b6c9-8f7e6d5c4b3a';
export const CONNECTION_ID = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';
const CONNECTED_AT = new Date('2026-11-03T09:00:00Z');

/** A stored connection as the repository returns it, without credentials. */
export function connectionRecord(
  overrides: Partial<ChannelConnectionRecord> = {},
): ChannelConnectionRecord {
  return {
    id: CONNECTION_ID,
    workspaceId: WORKSPACE_ID,
    channel: 'shopify',
    externalAccountId: FAKE_ACCOUNT,
    displayName: 'Demo Store',
    status: ChannelConnectionStatus.CONNECTED,
    credentialsExpiresAt: null,
    grantedScopes: ['read_products'],
    settings: { account: { channel: 'shopify' }, productSelection: null },
    statusReason: null,
    connectedById: USER_ID,
    connectedAt: CONNECTED_AT,
    disconnectedAt: null,
    lastSyncedAt: null,
    ordersPolledAt: null,
    ordersSyncedFrom: null,
    createdAt: CONNECTED_AT,
    updatedAt: CONNECTED_AT,
    ...overrides,
  };
}
