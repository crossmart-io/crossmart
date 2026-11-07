import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';

/** A lookup the model asked for, with its search text when it needs one. */
export interface AccountLookupRequest {
  kind: AccountLookupKind;
  /** A SKU or product title, for `listing_status`. */
  query: string | null;
}
