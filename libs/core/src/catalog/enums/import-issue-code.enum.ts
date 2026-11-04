export enum ImportIssueCode {
  /** A product with this handle is already in the catalog; it was left untouched. */
  AlreadyExists = 'already_exists',
  DuplicateSku = 'duplicate_sku',
  InvalidValue = 'invalid_value',
  MissingValue = 'missing_value',
  InvalidOptions = 'invalid_options',
  /** An update names a product handle that is not in the catalog. */
  NotFound = 'not_found',
  /** No variant in the catalog has this SKU. */
  UnknownSku = 'unknown_sku',
  /** The variant does not track stock, so its quantity was left as it was. */
  NotTracked = 'not_tracked',
  /** The same SKU appears on an earlier row of the file. */
  DuplicateRow = 'duplicate_row',
}
