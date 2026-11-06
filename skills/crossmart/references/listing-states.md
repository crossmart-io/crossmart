# Listing states and how to fix them

Every product on a store has one `displayState`. `list_store_products`, `get_product_stores`,
`add_product_to_store` and `retry_store_listing` return it.

| `displayState`  | Meaning                                                      | You do                          |
| --------------- | ------------------------------------------------------------ | ------------------------------- |
| `draft`         | Not selected for the store                                   | `add_product_to_store` if asked |
| `needs_details` | Selected, but the store setup or the product lacks something | Fix it (below), then retry      |
| `ready`         | Selected and publishable, not sent yet                       | Nothing; it goes out on sync    |
| `publishing`    | Queued or being published                                    | Check again later               |
| `published`     | On the store                                                 | Nothing                         |
| `failed`        | The store refused the last publish or update                 | Fix it (below), then retry      |
| `removing`      | Being taken off the store                                    | Nothing                         |
| `removed`       | Taken off the store, or removed from it by hand              | `add_product_to_store` if asked |

## Find what is missing

For a `needs_details` or `failed` row, read in this order:

1. `displayRequirement`, when present;
2. otherwise `listing.missingRequirement`;
3. otherwise `displayReason` (the channel's own message): show it to the seller as is.

## Act on the requirement

| Requirement                                                                                 | Next step                                                                               |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup` | Store setup only the seller can finish in the dashboard. Tell them what, then retry.    |
| `reconnect`, `account_settings`                                                             | The seller connects the store again in the dashboard.                                   |
| `category`                                                                                  | `suggest_store_categories`, then `set_store_category` ([ebay.md](ebay.md)), then retry. |
| `item_specifics`                                                                            | `get_item_specifics`, then `save_item_specifics` ([ebay.md](ebay.md)), then retry.      |
| `images`, `active_product`, `option_names`                                                  | Fix the product: `get_product`, then `replace_product` (confirm first), then retry.     |

## Retry

`retry_store_listing` (`productId`, `connectionId`) publishes one product to one store again. The
answer shows `publishing`; check later with `get_product_stores`.

- `409`: the store is not connected or doesn't select the product. Check `list_stores`, or add it
  with `add_product_to_store`.
- `402`: no room on the plan for another active listing. The seller must upgrade.

## Find every failed listing of a store

`list_store_products` with `connectionId` and `state: failed` (also `pending`, `listed`,
`removing`, `removed_by_hand`, `excluded`). It returns counts per state too. Group the failures by
requirement and propose one fix per group; confirm before fixing more than one product.
