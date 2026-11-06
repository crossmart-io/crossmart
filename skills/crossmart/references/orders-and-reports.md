# Orders and reports

## Orders

Orders from every store (Shopify, eBay…) share one list. They carry no buyer details: only what
was sold, its status and totals.

- `list_orders`: newest first. Filter by `status` (`OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`,
  `CANCELLED`), by `connectionId` for one store, or `search` by order number (`#1001`). Each order
  shows its `channel` and `storeName`.
- `get_order`: one order with its lines and the stock each line holds or has shipped.
  `unmatchedLines` counts lines whose SKU matches no Crossmart variant: suggest the seller adds or
  fixes that SKU.

Crossmart reads orders; fulfilling or refunding happens in the store itself.

## Reports

- `get_sales_report`: sales, orders, average order value and units against the period before, per
  day, store and product. `range`: `last_7_days`, `last_30_days`, `last_90_days`,
  `last_12_months`. Pass the seller's IANA `timeZone` when you know it.
- `get_inventory_report`: stock value at cost and at price, variants low or out of stock (with
  the ones lowest on stock), and each store's listings by status.
- `get_listing_health_report`: each store's products by display state, and the latest failed
  listings with their reason and `displayRequirement`, so you can say what to fix.
- `get_platform_health`: whether the Crossmart API is reachable.

Present numbers with their currency and compare with the previous period when the report gives it.
