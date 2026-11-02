export enum ImportIssueCode {
  /** A product with this handle is already in the catalog; it was left untouched. */
  AlreadyExists = 'already_exists',
  DuplicateSku = 'duplicate_sku',
  InvalidValue = 'invalid_value',
  MissingValue = 'missing_value',
  InvalidOptions = 'invalid_options',
}
