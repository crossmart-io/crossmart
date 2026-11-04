import type { SortDirection } from '@crossmart/common';
import type { OrderStatus } from '@crossmart/database';

export interface OrderLineView {
  id: string;
  title: string;
  sku: string | null;
  quantity: number;
  unitPrice: string;
  reservedQuantity: number;
  fulfilledQuantity: number;
  /** The catalog variant the line sells; null when it matched none and holds no stock. */
  variantId: string | null;
  productId: string | null;
}

export interface OrderSummary {
  id: string;
  name: string;
  status: OrderStatus;
  currencyCode: string;
  total: string;
  placedAt: Date;
  connectionId: string;
  storeName: string;
  channel: string;
  itemCount: number;
  /** Lines that match no catalog variant, so their stock is not tracked. */
  unmatchedLines: number;
}

export interface OrderDetail extends OrderSummary {
  externalId: string;
  lines: OrderLineView[];
}

export interface OrderListQuery {
  status?: OrderStatus;
  connectionId?: string;
  /** Matches the order number. */
  search?: string;
  /** By placing time; newest first by default. */
  direction?: SortDirection;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}

export interface OrderPage {
  items: OrderSummary[];
  nextCursor: string | null;
  /** How many match in all, for page numbers. */
  total: number;
}
