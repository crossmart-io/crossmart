/** How a channel product relates to the catalog when it is imported. */
export enum ProductMatchKind {
  /** Already linked through a listing with its external id; the listing is refreshed. */
  Linked = 'linked',
  /** A catalog product has the same handle; it is linked, not duplicated. */
  Handle = 'handle',
  /** A catalog product holds one of its SKUs; it is linked, not duplicated. */
  Sku = 'sku',
  /** Nothing matches; the product is created. */
  New = 'new',
  /** The matching catalog product is already linked to another product of the account. */
  Taken = 'taken',
}
