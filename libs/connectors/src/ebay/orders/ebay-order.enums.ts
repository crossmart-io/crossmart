/** `cancelStatus.cancelState` of a Fulfillment API order (eBay's `CancelStateEnum`). */
export enum EbayCancelState {
  /** The order has been cancelled. */
  Canceled = 'CANCELED',
  /** The buyer or seller asked to cancel; the order still stands. */
  InProgress = 'IN_PROGRESS',
  NoneRequested = 'NONE_REQUESTED',
}

/** `lineItemFulfillmentStatus` of an order line (eBay's `LineItemFulfillmentStatusEnum`). */
export enum EbayLineItemFulfillmentStatus {
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Fulfilled = 'FULFILLED',
}

/** `paymentSummary.refunds[].refundStatus` (eBay's `RefundStatusEnum`). */
export enum EbayRefundStatus {
  Pending = 'PENDING',
  Failed = 'FAILED',
  Refunded = 'REFUNDED',
}
