# Products and publishing

## Find products

- `list_products`: search by title, filter by `status` (`ACTIVE`, `DRAFT`, `ARCHIVED`), paged.
- `get_product`: one product with every variant, its stock, prices, options and images.

## Create a product

`create_product` needs a `title` and at least one variant with a `price` (decimal string).

- Several variants need `optionNames` (such as `["Size", "Color"]`) and `optionValues` on each
  variant, one value per option, in order.
- `quantity` on a variant is its opening stock.
- `media` takes public image URLs; the first one is the main image. Most stores need at least one.
- New products are `DRAFT` unless `status` is `ACTIVE`. Stores only sell active products.
- A SKU or handle already in the workspace is refused with `409`.

Before creating, summarize what you will create (title, variants, prices, stock) and confirm when
the seller didn't give you every value.

## Edit a product

`replace_product` saves the product **exactly as sent**: fields and variants left out are removed.

1. `get_product`.
2. Change only what the seller asked.
3. Send the whole product back, every variant with its `id`.

Confirm first, and say which variants (if any) would be removed. For stock with a reason (a
delivery, a count, damage), use `adjust_stock` instead (see [stock.md](stock.md)).

## Publish to a store

1. `list_stores` → pick the `connectionId`. Check `publishReadiness.ready` (see
   [stores.md](stores.md)).
2. `add_product_to_store` with `productId` and `connectionId`.
3. Read the answer's `displayState`:
   - `publishing` → it's queued. Check later with `get_product_stores`.
   - `needs_details` → see [listing-states.md](listing-states.md).
4. A `402` with `plan_limit_reached` means the plan has no room for another active listing: tell
   the seller to upgrade. Don't retry.

To publish **many** products, list them and confirm the count and the store first, then add them
one by one (or use the REST bulk endpoint in [rest-api.md](rest-api.md)). Report a
summary: how many are publishing, how many need details and why.

## Change a product on one store only

A store can show its own title, description, vendor (brand), tags, images, visibility, stock
limits and fixed prices, without changing the catalog.

1. `get_listing` with `productId` and `connectionId`. Each field has `product` (the catalog's
   value), `override` (null when it follows the product), `effective` (what the store gets) and
   `overridden`. Each variant also has `rulePrice`, the store's pricing rule result before a fixed
   price.
2. `update_listing` with only the fields to change: a value overrides, `null` reverts the field to
   the product, and fields left out keep their override. A variant price entry with both prices
   `null` goes back to the pricing rule.

Confirm the change first. A store that already lists the product gets an update queued.

## Remove from a store

`remove_product_from_store` takes the product off one store; it is archived there and keeps its
order history. Destructive: confirm first, naming the product and the store.

## AI-written titles and descriptions

`generate_content` (a `connectionId` and up to 100 `productIds`) queues AI content for one
store. Nothing changes yet: results arrive as `PENDING` suggestions (`list_suggestions`). A person
with the Approver, Admin or Owner role reviews them in the dashboard. Only call
`approve_suggestion` when the seller asks you to approve that specific suggestion; a `STALE` answer
means the field changed since, and nothing was applied.
