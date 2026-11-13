/** An item's `status` (Products sync guide). Writes take `active`, `paused` and `closed`. */
export enum MercadoLibreItemStatus {
  Active = 'active',
  Paused = 'paused',
  Closed = 'closed',
  UnderReview = 'under_review',
  Inactive = 'inactive',
  PaymentRequired = 'payment_required',
}

/** An item's `condition`. Refurbished items are `ITEM_CONDITION`, which Crossmart does not send. */
export enum MercadoLibreCondition {
  New = 'new',
  Used = 'used',
}

/** `listing_type_id`: `gold_special` is Clásica (Classic), `gold_pro` Premium. */
export enum MercadoLibreListingType {
  Classic = 'gold_special',
  Premium = 'gold_pro',
}

/** Crossmart lists at a fixed price only. */
export enum MercadoLibreBuyingMode {
  BuyItNow = 'buy_it_now',
}

/** An order's `status` (Manage sales guide). */
export enum MercadoLibreOrderStatus {
  Confirmed = 'confirmed',
  PaymentRequired = 'payment_required',
  PaymentInProcess = 'payment_in_process',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Cancelled = 'cancelled',
  Invalid = 'invalid',
}

/** Notification topics Crossmart subscribes to (Receive notifications guide). */
export enum MercadoLibreTopic {
  Orders = 'orders_v2',
  Items = 'items',
}

/** An attribute's `value_type` (Attributes guide). */
export enum MercadoLibreValueType {
  String = 'string',
  Number = 'number',
  NumberUnit = 'number_unit',
  Boolean = 'boolean',
  List = 'list',
}
