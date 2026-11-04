import type { ChannelSession } from '../auth/channel-session.js';
import type { ChannelPage } from './catalog.types.js';

/** One line of a channel order, as it stands now (after edits and removals). */
export interface ExternalOrderLine {
  externalId: string;
  externalVariantId: string | null;
  sku: string | null;
  title: string;
  /** Units the order holds now; removed units are not counted. */
  quantity: number;
  /** Units already shipped; never more than `quantity`. */
  fulfilledQuantity: number;
  /** The price of one unit, before discounts, as a decimal string. */
  unitPrice: string;
}

/** A channel order. Buyer details are not part of it: Crossmart does not need them. */
export interface ExternalOrder {
  externalId: string;
  /** The number the merchant and buyer see, such as `#1001`. */
  name: string;
  placedAt: Date;
  updatedAt: Date;
  cancelled: boolean;
  currencyCode: string;
  /** What the buyer pays now, after discounts, refunds and removals, as a decimal string. */
  total: string;
  lines: ExternalOrderLine[];
}

/** `ChannelCapability.FetchOrders`: reads orders, from webhooks and by polling as a fallback. */
export interface OrderSource {
  /** Orders changed since `updatedSince`, oldest change first, a page at a time. */
  fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>>;
  /** One order as it stands now; null when the channel no longer has it. */
  fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null>;
}
