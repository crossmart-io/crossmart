/**
 * Something publishing to a channel needs and does not have yet. The store-level ones block
 * every listing of a connection until the merchant finishes its setup; the listing-level ones
 * block one product until the merchant adds what is missing.
 */
export enum PublishRequirement {
  /** The channel no longer accepts the connection's credentials: connect it again. */
  Reconnect = 'reconnect',
  /** Crossmart has not read the account's settings yet: connect it again. */
  AccountSettings = 'account_settings',
  /** eBay: a shipping (fulfillment) business policy. */
  ShippingPolicy = 'shipping_policy',
  /** eBay: a payment business policy. */
  PaymentPolicy = 'payment_policy',
  /** eBay: a return business policy. */
  ReturnPolicy = 'return_policy',
  /** eBay: where items ship from. */
  ShipFromLocation = 'ship_from_location',
  /** Google: the country and the product page address listings use. */
  ListingSetup = 'listing_setup',
  /** The product needs at least one image the channel accepts. */
  Images = 'images',
  /** The product must be active (or set visible on the store) to be listed. */
  ActiveProduct = 'active_product',
  /** The listing needs a channel category (eBay suggested none). */
  Category = 'category',
  /** The listing lacks item specifics its category requires (eBay). */
  ItemSpecifics = 'item_specifics',
  /** The product's options need names, such as Size, to list its variants. */
  OptionNames = 'option_names',
}

/** Requirements of the store's setup, as opposed to one listing's details. */
export const STORE_PUBLISH_REQUIREMENTS: ReadonlySet<PublishRequirement> = new Set([
  PublishRequirement.Reconnect,
  PublishRequirement.AccountSettings,
  PublishRequirement.ShippingPolicy,
  PublishRequirement.PaymentPolicy,
  PublishRequirement.ReturnPolicy,
  PublishRequirement.ShipFromLocation,
  PublishRequirement.ListingSetup,
]);
