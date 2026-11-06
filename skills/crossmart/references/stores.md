# Stores: connecting and readiness

A store is a **channel connection** (Shopify, eBay, Google Merchant). Its `id` is the
`connectionId` every store tool takes.

## Connecting a store

You can't connect one. The marketplace asks the seller to approve access, so the seller does it in
the Crossmart dashboard: app.crossmart.io → **Channels → Connect**. Never ask for a marketplace
username, password or token.

## Is the store ready to publish?

`list_stores` (all stores) or `get_store` (one) returns:

- `status`: `CONNECTED` can publish; `NEEDS_REAUTH` means the seller must connect it again.
- `publishReadiness.ready`: `false` while the store's setup blocks every listing.
- `publishReadiness.missing`: what to finish, in order.
- `failedListings`: how many listings failed.

| `missing` value                                             | Tell the seller                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `shipping_policy`, `payment_policy`, `return_policy` (eBay) | Create or choose that business policy in the store's setup |
| `ship_from_location` (eBay)                                 | Set the address items ship from                            |
| `listing_setup` (Google)                                    | Finish the Merchant Center listing setup                   |
| `reconnect`, `account_settings`                             | Connect the store again in the dashboard                   |

All of these are done by the seller in the dashboard. Say what is missing, in plain words, and
offer to retry the affected listings once they're done (see [listing-states.md](listing-states.md)).
