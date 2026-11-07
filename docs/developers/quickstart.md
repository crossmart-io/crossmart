# Quickstart: from product to store to order

This guide walks through the core publishing flow: create a product, find a store, publish the
product there, follow its listing status, give it its own title and price on that store, and read
the orders that come in. Each step shows `curl` and the [TypeScript SDK](../../sdks/typescript/README.md).
The [Python](../../sdks/python/README.md) and [PHP](../../sdks/php/README.md) SDKs have the same
resources and methods, in each language's naming.

You need:

- A Crossmart workspace with at least one connected store. Stores are connected in the dashboard
  (**Channels**), because the marketplace asks the seller to approve access.
- An API key with the **Editor** role (or Admin), from **Settings → API keys**.

```bash
export CROSSMART_API_KEY="cm_…"            # your key
export CROSSMART_API=https://api.crossmart.io/api/v1
```

```bash
npm install @crossmart/sdk
```

```ts
import { Crossmart } from '@crossmart/sdk';

const crossmart = new Crossmart({ apiKey: process.env.CROSSMART_API_KEY! });
```

## 1. Find your workspace

Every call is scoped to a workspace. An API key belongs to exactly one, and tells you which:

```bash
curl "$CROSSMART_API/api-key" -H "x-api-key: $CROSSMART_API_KEY"
```

```json
{
  "apiKeyId": "1b6e…",
  "workspaceId": "7f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f",
  "role": "EDITOR",
  "customRole": null,
  "permissions": ["workspace:view", "products:view", "products:edit", "listings:edit", "…"]
}
```

```bash
export WORKSPACE_ID=7f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f
```

The SDK does this lookup for you on the first call. With an OAuth access token, pass
`{ workspaceId }` to `new Crossmart()` instead.

## 2. Create a product

A product has a title and at least one variant. Prices are decimal strings in the workspace's
currency. `quantity` is the opening stock. Products are drafts unless you set `status: "ACTIVE"`.
When you replace a product later (`PUT …/products/{productId}`), a variant sent without `quantity`
keeps its current stock.

```bash
curl -X POST "$CROSSMART_API/workspaces/$WORKSPACE_ID/products" \
  -H "x-api-key: $CROSSMART_API_KEY" -H "content-type: application/json" \
  -d '{
    "title": "Ceramic mug",
    "descriptionHtml": "<p>Hand-thrown stoneware, 350 ml.</p>",
    "vendor": "Clayworks",
    "tags": ["kitchen", "handmade"],
    "status": "ACTIVE",
    "optionNames": ["Color"],
    "media": [{ "url": "https://example.com/mug-blue.jpg", "altText": "Blue mug" }],
    "variants": [
      { "sku": "MUG-BLUE", "optionValues": ["Blue"], "price": "18.00", "quantity": 25 },
      { "sku": "MUG-SAND", "optionValues": ["Sand"], "price": "18.00", "quantity": 12 }
    ]
  }'
```

```ts
import { ProductStatus } from '@crossmart/sdk';

const product = await crossmart.products.create({
  title: 'Ceramic mug',
  descriptionHtml: '<p>Hand-thrown stoneware, 350 ml.</p>',
  vendor: 'Clayworks',
  tags: ['kitchen', 'handmade'],
  status: ProductStatus.ACTIVE,
  optionNames: ['Color'],
  media: [{ url: 'https://example.com/mug-blue.jpg', altText: 'Blue mug' }],
  variants: [
    { sku: 'MUG-BLUE', optionValues: ['Blue'], price: '18.00', quantity: 25 },
    { sku: 'MUG-SAND', optionValues: ['Sand'], price: '18.00', quantity: 12 },
  ],
});
```

The answer is the full product, with an `id` for it and for each variant:

```json
{
  "id": "3c1e9a5b-…",
  "handle": "ceramic-mug",
  "title": "Ceramic mug",
  "status": "ACTIVE",
  "variants": [
    { "id": "9a0b…", "sku": "MUG-BLUE", "price": "18.00", "available": 25, "…": "…" },
    { "id": "b1c2…", "sku": "MUG-SAND", "price": "18.00", "available": 12, "…": "…" }
  ],
  "…": "…"
}
```

```bash
export PRODUCT_ID=3c1e9a5b-…
```

A SKU or handle that already exists in the workspace is refused with `409`.

## 3. List your stores

```bash
curl "$CROSSMART_API/workspaces/$WORKSPACE_ID/channel-connections" -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
const stores = await crossmart.stores.list();
```

```json
[
  {
    "id": "5d2f0b6c-…",
    "channel": "shopify",
    "displayName": "Clayworks Shop",
    "status": "CONNECTED",
    "pricing": { "adjustmentPercent": "0", "fixedAmount": "0", "rounding": "none", "…": "…" },
    "failedListings": 0,
    "…": "…"
  }
]
```

A store is a channel connection; its `id` is the `connectionId` in the next steps. Publish only to
stores whose `status` is `CONNECTED`. `NEEDS_REAUTH` means the seller must reconnect it in the
dashboard.

```bash
export CONNECTION_ID=5d2f0b6c-…
```

## 4. Publish the product to the store

```bash
curl -X POST "$CROSSMART_API/workspaces/$WORKSPACE_ID/products/$PRODUCT_ID/channels/$CONNECTION_ID" \
  -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
const channel = await crossmart.listings.publish(product.id, store.id);
```

The product joins the store and stays there until you remove it, whatever the store's automatic
selection rule says. The answer shows the product on that store, with the price it will have there
after the store's pricing rule:

```json
{
  "connection": {
    "id": "5d2f0b6c-…",
    "channel": "shopify",
    "displayName": "Clayworks Shop",
    "status": "CONNECTED",
    "currencyCode": "USD"
  },
  "selected": true,
  "listing": {
    "id": "e4f5…",
    "status": "PENDING",
    "externalId": null,
    "externalUrl": null,
    "lastError": null,
    "…": "…"
  },
  "override": null,
  "variants": [
    {
      "variantId": "9a0b…",
      "title": "Blue",
      "price": { "price": "18.00", "explanation": "$18.00", "…": "…" },
      "quantity": 25
    }
  ]
}
```

To publish many products at once, send their ids to the store:

```bash
curl -X POST "$CROSSMART_API/workspaces/$WORKSPACE_ID/channel-connections/$CONNECTION_ID/products/add" \
  -H "x-api-key: $CROSSMART_API_KEY" -H "content-type: application/json" \
  -d '{ "productIds": ["3c1e9a5b-…", "…"] }'
```

```ts
const { count } = await crossmart.listings.publishMany(store.id, [firstId, secondId]);
```

Your plan limits active listings. Past the limit the API answers `402` with
`"code": "plan_limit_reached"`. Paid plans are not live yet, so limits are not enforced by
default (`ENTITLEMENTS_ENFORCED=false`).

### Check the listing status

Publishing runs in the background, so the listing starts as `PENDING`:

| Status     | Meaning                                                            |
| ---------- | ------------------------------------------------------------------ |
| `PENDING`  | Waiting to be sent to the store                                    |
| `ACTIVE`   | Live on the store; `externalUrl` links to it                       |
| `ERROR`    | The store refused it or the sync failed; `lastError` says why      |
| `INACTIVE` | On the store but not for sale (the product is a draft or archived) |
| `DELISTED` | Removed from the store                                             |

Read the product's channels again to follow it. Usually it takes seconds; poll every few seconds,
and back off if it stays `PENDING`.

Each entry also has `displayState`, the one state to show a merchant, computed by the server from
the store's selection, the listing and what publishing still needs. `displayReason` says why for
`needs_details` and `failed`, and `displayRequirement` names the `PublishRequirement` to fix first
for `needs_details` (such as `shipping_policy`, `images` or `active_product`), so a client can open
the right place. The same three fields are on a store's products and listings, and on each store
badge of the product list.

| `displayState`  | Meaning                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `draft`         | Not selected for the store                                                    |
| `needs_details` | Selected, but the store setup or the product lacks something (see the reason) |
| `ready`         | Selected and publishable, not sent yet                                        |
| `publishing`    | Queued or being published, including an update a sync or retry queued         |
| `published`     | On the store                                                                  |
| `failed`        | The store refused the last publish or update; `displayReason` has its message |
| `removing`      | Being taken off the store                                                     |
| `removed`       | Taken off the store, or removed from it by hand                               |

A store's `publishReadiness` says whether it can publish at all, and lists what its setup lacks in
`missing` (such as `shipping_policy` on eBay or `listing_setup` on Google).

```bash
curl "$CROSSMART_API/workspaces/$WORKSPACE_ID/products/$PRODUCT_ID/channels" -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
import { ListingStatus } from '@crossmart/sdk';

const channels = await crossmart.listings.forProduct(product.id);
const onStore = channels.find((candidate) => candidate.connection.id === store.id);
if (onStore?.listing?.status === ListingStatus.ACTIVE) {
  console.log('Live at', onStore.listing.externalUrl);
} else if (onStore?.listing?.status === ListingStatus.ERROR) {
  console.error('Refused:', onStore.listing.lastError);
}
```

To see every failed listing of a store, filter its listings:

```bash
curl "$CROSSMART_API/workspaces/$WORKSPACE_ID/channel-connections/$CONNECTION_ID/listings?status=ERROR" \
  -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
for await (const listing of crossmart.listings.listAll(store.id, { status: ListingStatus.ERROR })) {
  console.log(listing.productTitle, listing.lastError);
}
```

Fix the product (for example with `PUT …/products/{productId}`) and the change is sent to the store automatically.
To publish one product to one store again, without resyncing the whole store, retry it. The
answer is `202` with the product on that store, now `publishing`. It is `409` when the store must
be connected again (`code: store_not_connected`) or does not include the product
(`code: product_not_in_store`).

```bash
curl -X POST "$CROSSMART_API/workspaces/$WORKSPACE_ID/products/$PRODUCT_ID/channels/$CONNECTION_ID/retry" \
  -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
await crossmart.listings.retry(product.id, store.id);
```

A sync of a whole store (`POST …/channel-connections/{connectionId}/sync`) marks every listing it
queues with `syncRequestedAt` until its job finishes, so those listings show `publishing`, even
ones already on the store. Poll its progress until `done`:

```bash
curl "$CROSSMART_API/workspaces/$WORKSPACE_ID/channel-connections/$CONNECTION_ID/sync" \
  -H "x-api-key: $CROSSMART_API_KEY"
# {"pending":3,"failed":0,"done":false}
```

## 5. Override the title or price on one store

Each store can show the product differently: its own title, description, tags, images, visibility,
a stock buffer, a maximum quantity, and fixed prices per variant. Fields you leave out or set to
`null` follow the product.

```bash
curl -X PUT "$CROSSMART_API/workspaces/$WORKSPACE_ID/products/$PRODUCT_ID/channels/$CONNECTION_ID/override" \
  -H "x-api-key: $CROSSMART_API_KEY" -H "content-type: application/json" \
  -d '{
    "title": "Handmade ceramic mug | 350 ml",
    "variantPrices": [{ "variantId": "9a0b…", "price": "21.00", "compareAtPrice": null }]
  }'
```

```ts
await crossmart.listings.setOverride(product.id, store.id, {
  title: 'Handmade ceramic mug | 350 ml',
  variantPrices: [{ variantId: product.variants[0]!.id, price: '21.00', compareAtPrice: null }],
});
```

- `PUT` **replaces** the overrides: send every field you want to keep. `PATCH …/override`
  (`crossmart.listings.patchOverride`) changes only the fields it names; `null` reverts one field
  to the product's value, and a variant price entry with both prices `null` reverts that variant.
- A variant price here is in the store's currency and wins over the store's pricing rule.
- When the product is already listed, an update is queued to the store.
- `DELETE …/channels/{connectionId}/override` (`crossmart.listings.clearOverride`) goes back to the
  product's values.
- `GET …/channels/{connectionId}/listing` (`crossmart.listings.editor`) returns every field with the
  product's value, the override and the value the store gets (`product`, `override`, `effective`,
  `overridden`), for a listing editor.

### Price a whole store with a rule

Instead of fixing prices product by product, a store can have a pricing rule: a markup or discount,
a fixed amount, rounding, and an optional floor of cost plus a margin. Setting it needs the
`channels:manage` permission (Admin).

```bash
curl -X PUT "$CROSSMART_API/workspaces/$WORKSPACE_ID/channel-connections/$CONNECTION_ID/pricing" \
  -H "x-api-key: $CROSSMART_API_KEY" -H "content-type: application/json" \
  -d '{ "rule": { "adjustmentPercent": "10", "fixedAmount": "0", "rounding": "ending_99", "floor": null, "compareAt": "adjust" } }'
```

```ts
import { CompareAtMode, PriceRounding } from '@crossmart/sdk';

await crossmart.stores.updatePricing(store.id, {
  adjustmentPercent: '10',
  fixedAmount: '0',
  rounding: PriceRounding.ending_99,
  floor: null,
  compareAt: CompareAtMode.adjust,
});
```

Try a rule on a real product first with `POST …/pricing/preview`
(`crossmart.stores.previewPricing`); it changes nothing.

## 6. Remove the product from the store

```bash
curl -X DELETE "$CROSSMART_API/workspaces/$WORKSPACE_ID/products/$PRODUCT_ID/channels/$CONNECTION_ID" \
  -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
await crossmart.listings.remove(product.id, store.id);
```

It is delisted in the background, and the store's automatic rule won't add it back.

## 7. Read orders

Orders from every store arrive in Crossmart, and their stock is reserved and then taken from the
shared ledger, so other stores never oversell.

```bash
curl "$CROSSMART_API/workspaces/$WORKSPACE_ID/orders?status=OPEN&limit=20" -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
import { OrderStatus } from '@crossmart/sdk';

for await (const order of crossmart.orders.listAll({ status: OrderStatus.OPEN })) {
  console.log(order.name, order.storeName, order.total, order.currencyCode);
}
```

```json
{
  "items": [
    {
      "id": "c0d1…",
      "name": "#1001",
      "status": "OPEN",
      "currencyCode": "USD",
      "total": "39.00",
      "placedAt": "2026-11-05T09:12:44.000Z",
      "connectionId": "5d2f0b6c-…",
      "storeName": "Clayworks Shop",
      "channel": "shopify",
      "itemCount": 2,
      "unmatchedLines": 0
    }
  ],
  "nextCursor": null,
  "total": 1
}
```

Filter by `connectionId` for one store, or `search` by order number. One order with its lines:

```bash
curl "$CROSSMART_API/workspaces/$WORKSPACE_ID/orders/c0d1…" -H "x-api-key: $CROSSMART_API_KEY"
```

```ts
const order = await crossmart.orders.get(orderId);
for (const line of order.lines) {
  console.log(line.quantity, line.sku, line.unitPrice);
}
```

For totals, `GET …/analytics/sales?range=last_30_days` (`crossmart.reports.sales()`) returns sales,
orders, average order value and units against the period before, per day, store and product.

## Next

- [Developer overview](README.md): authentication, errors, pagination
- SDK references: [TypeScript](../../sdks/typescript/README.md), [Python](../../sdks/python/README.md), [PHP](../../sdks/php/README.md)
- [MCP server](mcp.md): let an AI agent do all of the above
- The [interactive API docs](https://api.crossmart.io/api/docs) for every endpoint and field
