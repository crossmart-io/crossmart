/** Channel-neutral meaning of a webhook, so core services do not parse channel topics. */
export enum ChannelWebhookKind {
  /** The merchant removed Crossmart's app: the credentials no longer work. */
  AccountDisconnected = 'account_disconnected',
  /** A buyer asked for the data stored about them (privacy law compliance). */
  CustomerDataRequested = 'customer_data_requested',
  /** A buyer's data must be erased. */
  CustomerRedactionRequested = 'customer_redaction_requested',
  /** All data about the account must be erased, some time after it disconnected. */
  AccountRedactionRequested = 'account_redaction_requested',
  /** An order was placed, edited, paid, fulfilled or cancelled; `resourceId` names it. */
  OrderChanged = 'order_changed',
  /** A topic this version of Crossmart does not handle; acknowledged and ignored. */
  Unhandled = 'unhandled',
}

export interface IncomingWebhook {
  /** The body exactly as received; signatures are computed over these bytes. */
  rawBody: Buffer;
  /** Header names are lower case. */
  headers: Readonly<Record<string, string | undefined>>;
}

export interface ChannelWebhookEvent {
  kind: ChannelWebhookKind;
  /** The channel's own topic, kept for logs. */
  topic: string;
  externalAccountId: string;
  /** The delivery id, for deduplication. */
  deliveryId: string | null;
  /** The parsed body; shape depends on the topic. */
  payload: unknown;
  /** The channel's id of what the event is about (the order, for `OrderChanged`). */
  resourceId?: string;
}

/** `ChannelCapability.ReceiveWebhooks`: verifies and parses webhook deliveries. */
export interface WebhookReceiver {
  /** Verifies the signature over the raw body; returns null when it does not verify. */
  verifyWebhook(webhook: IncomingWebhook): ChannelWebhookEvent | null;
}
