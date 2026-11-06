# Stock

Crossmart holds one stock ledger; every connected store gets the new quantity after a change.

- `list_inventory`: stock per variant: on hand, held for orders and available. Filter
  with `stockLevel` (`in_stock`, `low_stock`, `out_of_stock`, `untracked`) or `search`.
- `adjust_stock` changes one variant's stock on hand, by its `inventoryItemId` from
  `list_inventory`:
  - `mode: delta`: add units (positive) or remove them (negative).
  - `mode: set`: replace on hand with a counted quantity. Confirm first; it overwrites.
  - `reason`: `RECEIVED` (a delivery), `CORRECTION`, `RETURNED`, `DAMAGED`, `LOST` or `SOLD`.
  - `note`: optional, such as a supplier invoice number.

Pick the reason from what the seller says ("12 arrived from the supplier" → `delta`, `+12`,
`RECEIVED`). For several variants, list the changes in a table and confirm before applying them.

Stock held for open orders isn't available; don't set on-hand below what orders hold without
asking.
