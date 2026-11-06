/**
 * What happened, as the `type` of an outgoing webhook event (ADR 0023). Endpoints subscribe to
 * these. Values are stored as text, so a new type needs no migration; never rename one.
 */
export enum WebhookEventType {
  /** A channel order was seen for the first time. */
  OrderCreated = 'order.created',
  /** A newer copy of an order arrived: its status, lines or total changed. */
  OrderUpdated = 'order.updated',
  /** Stock of one or more items moved, for any reason: an order, an edit, an import. */
  InventoryStockChanged = 'inventory.stock_changed',
  /** A product went live on a store for the first time. */
  ListingPublished = 'listing.published',
  /** A store refused a listing for good; it is in error until fixed and retried. */
  ListingFailed = 'listing.failed',
  /** A listing was taken off its store. */
  ListingRemoved = 'listing.removed',
  ProductCreated = 'product.created',
  ProductUpdated = 'product.updated',
  ProductDeleted = 'product.deleted',
  /** Sent only by "send test event", to one endpoint, whatever it subscribes to. */
  Test = 'webhook.test',
}

/** The event types an endpoint can subscribe to: every one but the test event. */
export const SUBSCRIBABLE_WEBHOOK_EVENT_TYPES: readonly WebhookEventType[] = Object.values(
  WebhookEventType,
).filter((type) => type !== WebhookEventType.Test);
