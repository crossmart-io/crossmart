# n8n-nodes-crossmart

n8n nodes for [Crossmart](https://crossmart.io), the open-source multichannel platform for sellers
and their AI agents. Manage one catalog and one stock ledger, publish to Shopify and eBay (Google
Merchant and Etsy are in development, see the [channel status](https://docs.crossmart.io/channels/)),
and start workflows the moment orders come in, stock changes, listings go live
or fail, or products change.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) ·
[Triggers](#crossmart-trigger) · [Development](#development) · [Guide](https://docs.crossmart.io/integrations/n8n/)

## Installation

In n8n, open **Settings → Community nodes → Install**, enter `n8n-nodes-crossmart`, and confirm.
Self-hosted n8n can also install it with `npm install n8n-nodes-crossmart` in `~/.n8n/nodes`.
See n8n's [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

Create a **Crossmart API** credential:

| Field    | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| API Key  | A workspace API key, from **Settings → API keys** in the Crossmart dashboard                       |
| Base URL | `https://api.crossmart.io` (default). Self-hosted: your API's URL, such as `http://localhost:3000` |

The key is sent in the `x-api-key` header. n8n checks it with `GET /api/v1/api-key`, which also
tells the nodes which workspace the key belongs to. Give n8n its own key with the smallest role
that works: `VIEWER` for reading and the polling trigger, `EDITOR` to change products, stock and
listings, `ADMIN` to sync stores and for the **Crossmart Trigger**, which manages its webhook
endpoint and so needs the `webhooks:manage` permission (`ADMIN`, or a custom role that holds it).

## Operations

### Crossmart

| Resource      | Operation          | API                                                                   |
| ------------- | ------------------ | --------------------------------------------------------------------- |
| **Product**   | Create             | `POST /workspaces/{id}/products`                                      |
|               | Get                | `GET /workspaces/{id}/products/{productId}`                           |
|               | Get Many           | `GET /workspaces/{id}/products` (search, status, tags, vendor, sort)  |
|               | Update             | `GET` then `PUT /workspaces/{id}/products/{productId}`                |
|               | Delete             | `DELETE /workspaces/{id}/products/{productId}`                        |
| **Inventory** | Get Many           | `GET /workspaces/{id}/inventory-items` (search, stock level, sort)    |
|               | Get by SKU         | `GET /workspaces/{id}/inventory-items?search=…`, exact SKU match      |
|               | Get History        | `GET /workspaces/{id}/inventory-items/{itemId}/movements`             |
|               | Adjust Stock       | `POST /workspaces/{id}/inventory-items/{itemId}/adjustments`          |
| **Listing**   | Get for Product    | `GET /workspaces/{id}/products/{productId}/channels`                  |
|               | Get Many for Store | `GET /workspaces/{id}/channel-connections/{storeId}/listings`         |
|               | Publish            | `POST /workspaces/{id}/products/{productId}/channels/{storeId}`       |
|               | Retry              | `POST /workspaces/{id}/products/{productId}/channels/{storeId}/retry` |
|               | Unpublish          | `DELETE /workspaces/{id}/products/{productId}/channels/{storeId}`     |
| **Order**     | Get                | `GET /workspaces/{id}/orders/{orderId}`                               |
|               | Get Many           | `GET /workspaces/{id}/orders` (status, store, search)                 |
| **Store**     | Get                | `GET /workspaces/{id}/channel-connections/{storeId}`                  |
|               | Get Many           | `GET /workspaces/{id}/channel-connections`                            |
|               | Sync               | `POST /workspaces/{id}/channel-connections/{storeId}/sync`            |
|               | Get Sync Progress  | `GET /workspaces/{id}/channel-connections/{storeId}/sync`             |

All routes are under `/api/v1`. "Get Many" operations page through results with the API's cursor
when **Return All** is on. **Product → Update** changes only the fields you set: it reads the
product and sends it back whole, so variants, stock and images stay as they are. Change stock with
**Inventory → Adjust Stock**. The node can be used as a tool by n8n's AI Agent.

### Crossmart Trigger

A webhook trigger: Crossmart sends each event to n8n as it happens, with no polling delay or cost.
Pick one or more events:

| Event                   | `data` carries                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Order Created / Updated | `order`: `id`, `externalId`, `name`, `status`, `currencyCode`, `total`, `placedAt`, `connectionId`, `lines[]`                |
| Inventory Stock Changed | `items[]`: `inventoryItemId`, `variantId`, `productId`, `sku`, `available`, `reserved`, `onHand`, `availableDelta`, `reason` |
| Listing Published       | `listing`: `id`, `productId`, `connectionId`, `channel`, `status`, `externalId`, `externalUrl`, `lastError`                  |
| Listing Failed          | the same `listing`, with `lastError`                                                                                         |
| Listing Removed         | the same `listing`                                                                                                           |
| Product Created         | `product`: `id`, `title`, `handle`, `status`, `updatedAt`                                                                    |
| Product Updated         | the same `product`                                                                                                           |
| Product Deleted         | `product`: `id`, `title`                                                                                                     |

Each event is one item: the whole envelope, `{ id, type, createdAt, workspaceId, apiVersion, data }`,
so expressions read `{{$json.type}}` and `{{$json.data.order.total}}`. Test events
(`webhook.test`, from **Send test** in Crossmart) always start the workflow, whatever you picked.
The full catalog is in [Webhooks](https://github.com/crossmart-io/crossmart/blob/main/docs/developers/webhooks.md).

- **Activating** the workflow creates a webhook endpoint in the workspace for this workflow's URL
  and the chosen events, and keeps its signing secret in the workflow. **Deactivating** it deletes
  the endpoint. **Listen for Test Event** does the same with n8n's test URL, for one event.
- **Every delivery is verified**: the trigger checks the `Crossmart-Signature` header (HMAC-SHA256
  of the timestamp and the raw body, with the endpoint's secret, at most five minutes old) and
  answers `401` without running the workflow when it does not match.
- **Delivery is at least once**, so the trigger drops an event whose `id` it has just seen (it
  remembers the last 100).
- **Requirements**: the API key needs `webhooks:manage` (the `ADMIN` role, or a custom role that
  holds it), and Crossmart must reach n8n: for Crossmart Cloud, n8n needs a public `https` URL (set
  n8n's `WEBHOOK_URL` when it runs behind a proxy). Otherwise use the polling trigger.

Workflows saved with version 0.1 of the package keep polling: they use version 1 of the node,
which is the polling trigger below. New Crossmart Trigger nodes are version 2, the webhook trigger.

### Crossmart Polling Trigger

The fallback when Crossmart cannot reach n8n (n8n on a laptop, behind a firewall, or without
`https`). n8n checks on the schedule you set on the node, and any key role works:

| Event          | Emits                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| New Order      | Each order that came in since the last check, oldest first. Optional store filter |
| Stock Changed  | Each inventory item whose stock changed since the last check                      |
| Listing Failed | Each listing that a store started rejecting, with its error and store             |

The first check after you activate the workflow records where to start and emits nothing.
**Fetch Test Event** returns the latest matching item without moving that starting point. Items
are the API's resources (an order, an inventory item, a listing), not webhook envelopes.

## Compatibility

Built with `@n8n/node-cli` and tested against `n8n-workflow` 2.x. Requires n8n 1.x or later with
Node.js 22. The package has no runtime dependencies.

## Development

```bash
pnpm install
pnpm build      # compile to dist/ and copy icons
pnpm lint       # n8n's community node lint rules
pnpm test       # requests, webhook lifecycle and signatures, polling dedupe (vitest)
pnpm dev        # run n8n locally with the nodes loaded
```

## License

[MIT](LICENSE.md). This package only calls the Crossmart API; the rest of Crossmart is
[AGPL-3.0](../../LICENSE).
