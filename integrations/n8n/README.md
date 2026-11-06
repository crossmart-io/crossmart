# n8n-nodes-crossmart

n8n nodes for [Crossmart](https://crossmart.io), the open-source multichannel platform for sellers
and their AI agents. Manage one catalog and one stock ledger, publish to Shopify, eBay, Google
Merchant and Etsy, and start workflows when orders come in, stock changes or a store rejects a
listing.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) ·
[Trigger](#trigger) · [Development](#development) · [Guide](../../docs/developers/n8n.md)

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
that works: `VIEWER` for reading and triggers, `EDITOR` to change products, stock and listings,
`ADMIN` to sync stores.

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

A polling trigger (n8n checks on the schedule you set on the node):

| Event          | Emits                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| New Order      | Each order that came in since the last check, oldest first. Optional store filter |
| Stock Changed  | Each inventory item whose stock changed since the last check                      |
| Listing Failed | Each listing that a store started rejecting, with its error and store             |

The first check after you activate the workflow records where to start and emits nothing.
**Fetch Test Event** returns the latest matching item without moving that starting point.

## Compatibility

Built with `@n8n/node-cli` and tested against `n8n-workflow` 2.x. Requires n8n 1.x or later with
Node.js 22. The package has no runtime dependencies.

## Development

```bash
pnpm install
pnpm build      # compile to dist/ and copy icons
pnpm lint       # n8n's community node lint rules
pnpm test       # request building and trigger dedupe (vitest)
pnpm dev        # run n8n locally with the nodes loaded
```

## License

[AGPL-3.0](../../LICENSE), like the rest of Crossmart.
