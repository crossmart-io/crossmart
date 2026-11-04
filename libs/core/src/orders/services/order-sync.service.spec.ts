import {
  ChannelCapability,
  ChannelConnectorRegistry,
  type ExternalOrder,
  type OrderSource,
} from '@crossmart/connectors';
import type { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import type { ChannelSessionFactory } from '../../channels/services/channel-session.factory.js';
import {
  connectionRecord,
  WORKSPACE_ID,
} from '../../channels/testing/channel-connection.fixtures.js';
import { FakeOAuthConnector } from '../../channels/testing/fake-oauth-connector.js';
import { ORDER_POLL_OVERLAP_MS } from '../orders.constants.js';
import type { OrderIngestionService } from './order-ingestion.service.js';
import { OrderSyncService } from './order-sync.service.js';

const NOW = new Date('2026-11-04T12:00:00Z');
const POLLED = new Date('2026-11-04T11:58:00Z');

function order(id: string): ExternalOrder {
  return {
    externalId: id,
    name: id,
    placedAt: NOW,
    updatedAt: NOW,
    cancelled: false,
    currencyCode: 'USD',
    total: '1.00',
    lines: [],
  };
}

function setup() {
  const connector = Object.assign(new FakeOAuthConnector(), {
    fetchOrders: vi.fn<OrderSource['fetchOrders']>(),
    fetchOrder: vi.fn<OrderSource['fetchOrder']>(),
  });
  connector.capabilities = new Set([ChannelCapability.FetchOrders]);
  const connections = {
    listConnected: vi
      .fn<ChannelConnectionRepository['listConnected']>()
      .mockResolvedValue([
        connectionRecord({ id: 'c-1', ordersPolledAt: POLLED, ordersSyncedFrom: POLLED }),
        connectionRecord({ id: 'c-2', ordersSyncedFrom: POLLED }),
      ]),
    markOrdersPolled: vi.fn<ChannelConnectionRepository['markOrdersPolled']>().mockResolvedValue(),
    startOrderSync: vi.fn<ChannelConnectionRepository['startOrderSync']>().mockResolvedValue(NOW),
  };
  const ingestion = {
    ingest: vi
      .fn<OrderIngestionService['ingest']>()
      .mockResolvedValue({ applied: true, changedInventoryItemIds: [], oversold: [] }),
  };
  const service = new OrderSyncService(
    connections as unknown as ChannelConnectionRepository,
    new ChannelConnectorRegistry([connector]),
    { open: vi.fn(() => Promise.resolve({})) } as unknown as ChannelSessionFactory,
    ingestion as unknown as OrderIngestionService,
  );
  return { service, connector, connections, ingestion };
}

describe('OrderSyncService.pollAll', () => {
  it('reads each store from just before its last poll, page by page, and keeps going past a failing store', async () => {
    const { service, connector, connections, ingestion } = setup();
    connector.fetchOrders
      .mockResolvedValueOnce({ items: [order('a')], nextCursor: 'next' })
      .mockResolvedValueOnce({ items: [order('b')], nextCursor: null })
      .mockRejectedValueOnce(new Error('down'));

    expect(await service.pollAll(NOW)).toBe(2);

    expect(connector.fetchOrders.mock.calls.map(([, since, cursor]) => [since, cursor])).toEqual([
      [new Date(POLLED.getTime() - ORDER_POLL_OVERLAP_MS), null],
      [new Date(POLLED.getTime() - ORDER_POLL_OVERLAP_MS), 'next'],
      [new Date(POLLED.getTime() - ORDER_POLL_OVERLAP_MS), null],
    ]);
    expect(ingestion.ingest).toHaveBeenCalledTimes(2);
    expect(connections.markOrdersPolled).toHaveBeenCalledTimes(1);
    expect(connections.markOrdersPolled).toHaveBeenCalledWith(WORKSPACE_ID, 'c-1', NOW);
  });
});
