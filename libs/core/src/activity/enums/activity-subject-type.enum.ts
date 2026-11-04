/** The kind of record an activity event is about. Stored as text, like `ActivityAction`. */
export enum ActivitySubjectType {
  Product = 'product',
  ProductView = 'product_view',
  /** An entry of the import history; the event links to it. */
  ImportJob = 'import_job',
  ApiKey = 'api_key',
}
