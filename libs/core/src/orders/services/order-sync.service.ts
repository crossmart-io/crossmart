import { Injectable, Logger } from '@nestjs/common';
import { requireEnumValue } from '@crossmart/common';
import {
  ChannelCapability,
  type ChannelConnector,
  ChannelConnectorRegistry,
  type ChannelSession,
  ChannelType,
  type OrderSource,
  supportsCapability,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { ChannelConnectionRecord } from '../../channels/repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { ChannelSessionFactory } from '../../channels/services/channel-session.factory.js';
import type { OrderRef } from '../entities/order-ingestion.js';
import { ORDER_POLL_OVERLAP_MS } from '../orders.constants.js';
import { OrderIngestionService, type OrderOrigin } from './order-ingestion.service.js';

type OrderConnector = ChannelConnector & OrderSource;

interface OpenedStore {
  origin: OrderOrigin;
  connector: OrderConnector;
  session: ChannelSession;
}

/**
 * Reads orders from connected stores: every store's changes since its last poll (the
 * fallback for missed webhooks), or one order a webhook named. Both end in ingestion.
 */
@Injectable()
export class OrderSyncService {
  private readonly logger = new Logger(OrderSyncService.name);

  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly registry: ChannelConnectorRegistry,
    private readonly sessions: ChannelSessionFactory,
    private readonly ingestion: OrderIngestionService,
  ) {}

  /** Polls every connected store in turn; one store failing does not stop the others. */
  async pollAll(now: Date = new Date()): Promise<number> {
    let read = 0;
    for (const record of await this.connections.listConnected()) {
      try {
        read += await this.poll(record, now);
      } catch (error) {
        const reason = error instanceof Error ? error.message : typeof error;
        this.logger.warn(`Polling orders of connection ${record.id} failed: ${reason}`);
      }
    }
    return read;
  }

  /** Reads one store's orders changed since its last poll; returns how many were read. */
  async pollConnection(
    workspaceId: string,
    connectionId: string,
    now: Date = new Date(),
  ): Promise<number> {
    const record = await this.connections.findForWorkspace(workspaceId, connectionId);
    return record?.status === ChannelConnectionStatus.CONNECTED ? this.poll(record, now) : 0;
  }

  /** Reads one order a webhook said changed. Throws for the queue to retry an outage. */
  async fetchOne(ref: OrderRef): Promise<void> {
    const record = await this.connections.findForWorkspace(ref.workspaceId, ref.connectionId);
    const store = record?.status === ChannelConnectionStatus.CONNECTED && (await this.open(record));
    if (!store) return;
    const order = await store.connector.fetchOrder(store.session, ref.externalOrderId);
    if (order) await this.ingestion.ingest(store.origin, order);
  }

  private async poll(record: ChannelConnectionRecord, now: Date): Promise<number> {
    const store = await this.open(record);
    if (!store) return 0;
    const since = new Date(
      (record.ordersPolledAt ?? store.origin.syncedFrom).getTime() - ORDER_POLL_OVERLAP_MS,
    );
    let cursor: string | null = null;
    let read = 0;
    do {
      const page = await store.connector.fetchOrders(store.session, since, cursor);
      for (const order of page.items) {
        await this.ingestion.ingest(store.origin, order);
      }
      read += page.items.length;
      cursor = page.nextCursor;
    } while (cursor !== null);
    await this.connections.markOrdersPolled(record.workspaceId, record.id, now);
    return read;
  }

  /** The connection's connector and a session, when it reads orders; null otherwise. */
  private async open(record: ChannelConnectionRecord): Promise<OpenedStore | null> {
    const connector = this.registry.find(requireEnumValue(ChannelType, record.channel));
    if (!connector || !supportsCapability(connector, ChannelCapability.FetchOrders)) return null;
    const syncedFrom =
      record.ordersSyncedFrom ??
      (await this.connections.startOrderSync(record.workspaceId, record.id, new Date()));
    return {
      connector,
      session: await this.sessions.open(record.workspaceId, record.id),
      origin: {
        workspaceId: record.workspaceId,
        connectionId: record.id,
        storeName: record.displayName,
        syncedFrom,
      },
    };
  }
}
