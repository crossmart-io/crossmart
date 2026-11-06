/**
 * The `data` of each event type, as endpoints receive it. Plain JSON: ids are strings, money is
 * a decimal string, times are ISO 8601 strings. Fields may be added within a version, never
 * removed or renamed. Declared as type aliases so they are JSON values for Prisma.
 */

export type OrderLineEventData = {
  externalId: string;
  sku: string | null;
  title: string;
  quantity: number;
  unitPrice: string;
  /** The catalog variant the line sells; null when it matched none. */
  variantId: string | null;
};

export type OrderEventData = {
  order: {
    id: string;
    externalId: string;
    name: string;
    status: string;
    currencyCode: string;
    total: string;
    placedAt: string;
    connectionId: string;
    channel: string;
    lines: OrderLineEventData[];
  };
};

export type StockChangeEventData = {
  inventoryItemId: string;
  variantId: string;
  productId: string;
  sku: string | null;
  /** What can be sold now. */
  available: number;
  /** Held for open orders. */
  reserved: number;
  /** Available plus reserved. */
  onHand: number;
  availableDelta: number;
  /** An `InventoryMovementReason`, such as `ORDER_SHIPPED` or `ADJUSTMENT`. */
  reason: string;
};

export type StockChangedEventData = { items: StockChangeEventData[] };

export type ListingEventData = {
  listing: {
    id: string;
    productId: string;
    connectionId: string;
    channel: string;
    status: string;
    externalId: string | null;
    externalUrl: string | null;
    lastError: string | null;
  };
};

export type ProductEventData = {
  product: { id: string; title: string; handle: string; status: string; updatedAt: string };
};

export type DeletedProductEventData = { product: { id: string; title: string } };

export type TestEventData = { endpointId: string; message: string };

export type WebhookEventData =
  | OrderEventData
  | StockChangedEventData
  | ListingEventData
  | ProductEventData
  | DeletedProductEventData
  | TestEventData;
