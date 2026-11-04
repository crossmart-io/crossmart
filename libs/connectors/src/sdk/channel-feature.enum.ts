/** Something a connection can do only when the merchant granted the scope it needs. */
export enum ChannelFeature {
  /** Published products are shown to shoppers in the store's own storefront. */
  StorefrontVisibility = 'storefront_visibility',
  /** Orders are read from the store, so its sales reserve stock everywhere else. */
  OrderSync = 'order_sync',
}

/** A scope the connector asks for but works without; a connection lacking it loses `feature`. */
export interface OptionalScope {
  scope: string;
  feature: ChannelFeature;
}
