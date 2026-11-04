/** A channel said one of a connection's orders changed (placed, edited, shipped, cancelled). */
export interface OrderChangedEvent {
  workspaceId: string;
  connectionId: string;
  externalOrderId: string;
}

/** Reacts to channel events, such as by reading the order. Handlers must not throw. */
export interface ChannelEventListener {
  onOrderChanged(event: OrderChangedEvent): Promise<void>;
}
