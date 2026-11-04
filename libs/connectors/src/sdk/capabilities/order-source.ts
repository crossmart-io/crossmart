import type { ChannelSession } from '../auth/channel-session.js';
import type { ChannelPage } from './catalog.types.js';

export interface ExternalOrderLine {
  externalVariantId: string | null;
  sku: string | null;
  quantity: number;
}

export interface ExternalOrder {
  externalId: string;
  placedAt: Date;
  lines: ExternalOrderLine[];
}

/** `ChannelCapability.FetchOrders`: polls orders, the fallback when webhooks are missed. */
export interface OrderSource {
  fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>>;
}
