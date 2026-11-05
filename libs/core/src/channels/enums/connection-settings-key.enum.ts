/**
 * The top-level keys of a connection's `settings` column, named as in `ConnectionSettings`.
 * Each part has its own writer, which replaces only its key, so saving one part never
 * reverts another.
 */
export enum ConnectionSettingsKey {
  Account = 'account',
  ProductSelection = 'productSelection',
  Pricing = 'pricing',
}
