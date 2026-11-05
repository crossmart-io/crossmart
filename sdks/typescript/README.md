# @crossmart/sdk

The official TypeScript SDK for the [Crossmart](https://crossmart.io) API: products, inventory,
stores, listings, orders, reports and AI content for sellers and their AI agents.

- Every request and response is typed from the API's OpenAPI spec, so it never drifts from the API.
- Works in Node.js 18+ and in browsers (ESM, no dependencies besides [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/)).
- Typed errors, automatic retries for safe requests, and async iterators over every list.

New to Crossmart? Read the [developer guide](../../docs/developers/README.md) first.

## Install

```bash
npm install @crossmart/sdk
# or: pnpm add @crossmart/sdk / yarn add @crossmart/sdk
```

## Authentication

Create an API key in the dashboard: **Settings → API keys → Create key**. Choose a role for it:

| Role       | Can do                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| `VIEWER`   | Read products, stock, orders, stores, reports and suggestions                            |
| `EDITOR`   | Also edit products and stock, add products to stores, override them, generate AI content |
| `APPROVER` | Read everything, and approve or reject AI suggestions                                    |
| `ADMIN`    | Everything above, plus store pricing and sync, members and API keys                      |

A key can't have more access than the person who creates it, and a key works in exactly one
workspace. The full permission table is in [docs/permissions.md](../../docs/permissions.md).
The key is shown once: store it in a secret manager or an environment variable, never in code.

```ts
import { Crossmart } from '@crossmart/sdk';

const crossmart = new Crossmart({ apiKey: process.env.CROSSMART_API_KEY! });
```

With an API key you don't need to pass a workspace id: the SDK asks the API which workspace the
key belongs to (once) and uses it for every call.

AI agents and apps that sign in with OAuth (coming soon) pass their access token instead. A token
can reach several workspaces, so give the workspace id too:

```ts
const crossmart = new Crossmart({ accessToken }, { workspaceId });
```

### Options

```ts
new Crossmart(credentials, {
  baseUrl: 'http://localhost:3000', // self-hosted; default https://api.crossmart.io
  workspaceId: '…', // default workspace for every call
  retry: { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 8000 },
  fetch: customFetch, // e.g. for tests
});
```

Every method also takes `{ workspaceId, signal }` as its last argument, to act on another
workspace or to cancel the request with an `AbortSignal`.

## Quick start

```ts
import {
  ChannelConnectionStatus,
  Crossmart,
  ListingStatus,
  OrderStatus,
  ProductStatus,
} from '@crossmart/sdk';

const crossmart = new Crossmart({ apiKey: process.env.CROSSMART_API_KEY! });

// 1. List products
const { items, total } = await crossmart.products.list({ search: 'mug', limit: 10 });
console.log(
  `${total} products match`,
  items.map((product) => product.title),
);

// 2. Create a product (prices are decimal strings in the workspace currency)
const product = await crossmart.products.create({
  title: 'Ceramic mug',
  descriptionHtml: '<p>Hand-thrown stoneware, 350 ml.</p>',
  status: ProductStatus.ACTIVE,
  variants: [{ sku: 'MUG-01', price: '18.00', quantity: 25 }],
});

// 3. Publish it to a store
const stores = await crossmart.stores.list();
const store = stores.find((candidate) => candidate.status === ChannelConnectionStatus.CONNECTED);
if (store) {
  const channel = await crossmart.listings.publish(product.id, store.id);
  console.log(channel.listing?.status); // PENDING: the store is being updated in the background

  // Give this store its own title and price
  await crossmart.listings.setOverride(product.id, store.id, {
    title: 'Handmade ceramic mug | 350 ml',
    variantPrices: [{ variantId: product.variants[0]!.id, price: '21.00', compareAtPrice: null }],
  });

  // Later: check that the store accepted it
  const [current] = (await crossmart.listings.forProduct(product.id)).filter(
    (candidate) => candidate.connection.id === store.id,
  );
  if (current?.listing?.status === ListingStatus.ERROR) {
    console.error('The store refused the listing:', current.listing.lastError);
  }
}

// 4. Read open orders
for await (const order of crossmart.orders.listAll({ status: OrderStatus.OPEN })) {
  console.log(order.name, order.storeName, order.total, order.currencyCode);
}
```

## Resources

| Resource                | Methods                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `crossmart.products`    | `list`, `listAll`, `get`, `create`, `update`, `delete`                                                            |
| `crossmart.inventory`   | `list`, `listAll`, `adjust`, `listMovements`, `listAllMovements`                                                  |
| `crossmart.stores`      | `list`, `get`, `updatePricing`, `previewPricing`, `sync`                                                          |
| `crossmart.listings`    | `forProduct`, `publish`, `remove`, `publishMany`, `removeMany`, `setOverride`, `clearOverride`, `list`, `listAll` |
| `crossmart.orders`      | `list`, `listAll`, `get`                                                                                          |
| `crossmart.reports`     | `sales`, `inventory`                                                                                              |
| `crossmart.ai`          | `status`, `usage`, `generateContent`, `draftContent`                                                              |
| `crossmart.suggestions` | `list`, `listAll`, `get`, `approve`, `reject`, `approveMany`                                                      |
| `crossmart.workspaces`  | `get`, `update`, `currentApiKey`                                                                                  |

Each method has TSDoc with an example, so your editor shows it on hover. Request and response
types are exported by name (`Product`, `CreateProductInput`, `Order`, `ListingOverrideInput`…),
and so is every enum of the API (`ProductStatus`, `ListingStatus`, `StockAdjustmentMode`…).

For an endpoint the resources don't cover, use the typed client underneath:

```ts
const { data, error } = await crossmart.http.GET('/api/v1/workspaces/{workspaceId}/catalog-stats', {
  params: { path: { workspaceId } },
});
```

## Pagination

Lists return one page: `{ items, nextCursor, total }`. Pass `nextCursor` back as `cursor` to read
the next one. `limit` is 1 to 100.

```ts
const first = await crossmart.products.list({ limit: 50 });
const second = await crossmart.products.list({ limit: 50, cursor: first.nextCursor ?? undefined });
```

Or let `listAll` walk the pages for you. It fetches lazily, 100 at a time, and stops when you
break out of the loop:

```ts
for await (const item of crossmart.inventory.listAll({ stockLevel: StockLevel.low_stock })) {
  console.log(item.sku, item.available);
}
```

## Errors

When the API answers with an error, methods throw a `CrossmartApiError` with:

- `status`: the HTTP status (`400`, `402`, `403`, `404`…)
- `message`: the API's message (validation errors are joined; each one is in `details`)
- `code`: the machine-readable reason, when there is one, such as `plan_limit_reached`
- `body`: the whole parsed response

```ts
import { CrossmartApiError, EntitlementErrorCode } from '@crossmart/sdk';

try {
  await crossmart.listings.publish(productId, storeId);
} catch (error) {
  if (error instanceof CrossmartApiError) {
    if (error.code === EntitlementErrorCode.plan_limit_reached) {
      console.log('Upgrade the plan to list more products:', error.message);
    } else if (error.status === 404) {
      console.log('No such product or store in this workspace');
    } else {
      throw error;
    }
  }
}
```

| Status | Meaning                                                                                  |
| ------ | ---------------------------------------------------------------------------------------- |
| 400    | The request is invalid; `details` lists every problem                                    |
| 401    | The API key or token is missing, wrong, revoked or expired                               |
| 402    | The plan does not allow it (`code`: `plan_limit_reached` or `plan_feature_not_included`) |
| 403    | The key's role lacks the permission (`Requires the products:edit permission`)            |
| 404    | Not found, or not in this workspace                                                      |
| 409    | Conflicts with the current state (a duplicate SKU or handle, for example)                |

Other problems (no credentials, no workspace id) throw a `CrossmartError`, the base class of
`CrossmartApiError`.

## Retries

Requests that are safe to repeat (`GET`, `PUT`, `DELETE`) are retried up to twice after a `429`,
a `5xx` or a network failure, with exponential backoff and jitter. When the API sends
`Retry-After`, the SDK waits that long (up to a minute; a longer wait returns the error). `POST`
and `PATCH` requests are never retried, so a product is never created twice. Turn retries off with
`{ retry: { maxRetries: 0 } }`.

## Development

The SDK lives in the Crossmart backend repository and is its own package:

```bash
cd sdks/typescript
pnpm install
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

`src/generated/schema.ts` is generated from the API's OpenAPI spec. After changing the API:

```bash
# in the repository root
pnpm build:api && pnpm openapi:generate   # writes openapi.json
# in sdks/typescript
pnpm generate                              # rewrites src/generated/schema.ts
```

CI rebuilds the spec on every pull request that touches the API or the SDK and runs
`pnpm check:drift`, which fails when the committed schema differs from a fresh generation.

### Releasing

Releases are published to npm by the
[`Release TypeScript SDK`](../../.github/workflows/sdk-typescript-release.yml) workflow when a
tag `sdk-ts-v<version>` is pushed. See the workflow file for the one-time npm setup.

## License

[AGPL-3.0](../../LICENSE), like the rest of Crossmart.
