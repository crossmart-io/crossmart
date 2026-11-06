/** `who_made` of a listing (OpenAPI spec). */
export enum EtsyWhoMade {
  IDid = 'i_did',
  SomeoneElse = 'someone_else',
  Collective = 'collective',
}

/** `when_made` of a listing, as Etsy's spec lists them (Etsy moves the first range yearly). */
export enum EtsyWhenMade {
  MadeToOrder = 'made_to_order',
  From2020To2026 = '2020_2026',
  From2010To2019 = '2010_2019',
  From2007To2009 = '2007_2009',
  Before2007 = 'before_2007',
  From2000To2006 = '2000_2006',
  The1990s = '1990s',
  The1980s = '1980s',
  The1970s = '1970s',
  The1960s = '1960s',
  The1950s = '1950s',
  The1940s = '1940s',
  The1930s = '1930s',
  The1920s = '1920s',
  The1910s = '1910s',
  The1900s = '1900s',
  The1800s = '1800s',
  The1700s = '1700s',
  Before1700 = 'before_1700',
}

/** A listing's `state` (OpenAPI spec). Writes take only `active` and `inactive`. */
export enum EtsyListingState {
  Active = 'active',
  Inactive = 'inactive',
  SoldOut = 'sold_out',
  Draft = 'draft',
  Removed = 'removed',
  Expired = 'expired',
}

/** Crossmart lists physical products only. */
export enum EtsyListingType {
  Physical = 'physical',
}

/** A receipt's `status` (OpenAPI spec). */
export enum EtsyReceiptStatus {
  Paid = 'paid',
  Completed = 'completed',
  Open = 'open',
  PaymentProcessing = 'payment processing',
  Canceled = 'canceled',
  FullyRefunded = 'fully refunded',
  PartiallyRefunded = 'partially refunded',
}

/** A processing profile's `readiness_state`. */
export enum EtsyReadinessState {
  ReadyToShip = 'ready_to_ship',
  MadeToOrder = 'made_to_order',
}
