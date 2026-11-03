# Shopify

Crossmart connects to Shopify as a non-embedded app using the OAuth authorization code grant.
The merchant enters their store's `*.myshopify.com` domain on the Channels page and approves the
app on Shopify. Shopify then redirects to the API, which stores the connection and sends the
merchant back to the Channels page.

## What Crossmart uses (Admin API 2026-10)

|            |                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API        | GraphQL Admin API, version `2026-10` (`SHOPIFY_ADMIN_API_VERSION`)                                                                                                                            |
| Scopes     | `read_products`, `write_products`, `read_inventory`, `write_inventory`, `read_locations`                                                                                                      |
| Tokens     | Expiring offline tokens (`expiring=1`): 1 hour access token, 90 day refresh token. Refreshed 5 minutes before expiry, under a database lock. Public apps must use these from January 1, 2027. |
| Callback   | `{API_PUBLIC_URL}/api/v1/channels/shopify/oauth/callback`                                                                                                                                     |
| Webhooks   | `{API_PUBLIC_URL}/api/v1/webhooks/shopify`, verified with `X-Shopify-Hmac-Sha256` over the raw body                                                                                           |
| Disconnect | The `appUninstall` mutation, which revokes the token. It is skipped while another workspace still uses the same store.                                                                        |

`API_PUBLIC_URL` defaults to `BETTER_AUTH_URL`.

## Catalog import

**Import products from Shopify** on the Channels page (or
`POST /api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/imports`, which needs
`catalog:edit`) queues an import on the lowest-priority `import` queue. The worker reads the
store with the `CatalogProducts` query, 8 products per page in id order, each with its first 10
variants and 10 images; products with more variants get `ProductVariants` pages of 100. Stock
is read at the store's primary location. Cursor pages were chosen over a bulk operation so each
page is written before the next is read and an import resumes from its stored cursor.

For each Shopify product:

| Case                                                      | What Crossmart does                                                                                                                                                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Already linked to this store (a listing with its GID)     | Refreshes the listing and its variant ids. Product content and stock stay as they are in Crossmart.                                                                                                                               |
| A catalog product has the same handle, or one of its SKUs | Links it: a listing maps each Shopify variant to the catalog variant with the same SKU or option values. Content and stock stay.                                                                                                  |
| Nothing matches                                           | Creates the product (active, or a draft when it is not active on Shopify), with each variant's "Cost per item" as its cost, and sets its stock through the inventory ledger (`IMPORTED`, credited to whoever started the import). |

Every listing stores the Shopify product, variant and inventory item GIDs, so publishing and
stock sync can update them later. Images keep their Shopify CDN URLs, as CSV imports do.
Variants that match nothing, catalog products already linked to another product of the store,
and products that break the catalog's rules are listed on the import's history entry.

Starting an import while one of the same store runs returns the running one. Each page is
recorded with the cursor after it, so a retried import continues where it stopped, and a
repeated import is safe: it only refreshes the listings.

## Products in a store

A store gets only the products the merchant adds to it, plus those its automatic rule matches:

- **Added by hand** (the product page's Channels card, or several at once from the products
  table) or **imported** from the store: they stay until removed by hand, whatever the rule says.
  Adding publishes the product at once.
- **Automatic rule** (the store's Settings): off by default; all products, or those matching
  filters (tags, vendor, status, gaps, search). A product added this way leaves the store when
  the rule stops matching it.
- **Removed by hand**: delisted at once, and the rule cannot add it back until it is added again.

Each listing stores how it joined (`listings.source`: `MANUAL`, `IMPORT` or `RULE`). The store's
Listings tab (`GET .../channel-connections/{id}/products`) shows each product's state there:
listed, pending, failed or removing.

## Publishing and stock

| Operation       | Admin GraphQL                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Publish, update | `productSet` (synchronous), by product id on update: options, every variant (variants left out are deleted), images from public URLs, SKU, barcode, price, compare-at, cost, weight, stock policy. The handle is only set on create. |
| Opening stock   | `inventoryQuantities` of new variants, at the primary location                                                                                                                                                                       |
| Stock           | `inventorySetQuantities` with `@idempotent` and `changeFromQuantity: null` (Crossmart's ledger is the source of truth), 250 items per call                                                                                           |
| Prices          | `productVariantsBulkUpdate`, one call per product                                                                                                                                                                                    |
| Delist          | `productUpdate` to `ARCHIVED`: the product leaves sales channels but keeps its orders. Publishing again updates and reactivates it.                                                                                                  |

Images are re-sent only when they changed (`listings.media_digest`). A listing whose Crossmart status is not active,
or that is hidden on the channel, is sent as `DRAFT`. User errors are stored on the listing as `lastError`.

## App settings (Shopify Dev Dashboard)

Create an app in the [Dev Dashboard](https://dev.shopify.com/dashboard), then put its client ID
and secret in `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. Set a `CREDENTIALS_MASTER_KEY` as
well. Without it, channels cannot be connected.

In a new app version, set:

- **App URL**: the web app's Channels page, for example `http://localhost:5173/channels`.
- **Embed app in Shopify admin**: off.
- **Redirect URLs**: the callback above, for example
  `http://localhost:3000/api/v1/channels/shopify/oauth/callback`. It must match exactly.
- **Scopes**: the five scopes above.
- **Webhooks API version**: `2026-10`.

### Webhooks

Shopify recommends app-specific subscriptions in the app configuration over subscriptions
created per shop through the API. Mandatory compliance topics can only be configured there.
Crossmart therefore does not register webhooks on connect. Configure them in the app version or
in `shopify.app.toml` and deploy with `shopify app deploy`:

```toml
embedded = false

[access_scopes]
scopes = "read_products,write_products,read_inventory,write_inventory,read_locations"

[auth]
redirect_urls = ["https://api.example.com/api/v1/channels/shopify/oauth/callback"]

[webhooks]
api_version = "2026-10"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "https://api.example.com/api/v1/webhooks/shopify"

  [[webhooks.subscriptions]]
  compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
  uri = "https://api.example.com/api/v1/webhooks/shopify"
```

| Topic                                        | What Crossmart does                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/uninstalled`                            | Marks every connection to the store as disconnected and wipes its credentials                    |
| `customers/data_request`, `customers/redact` | Acknowledges them. Crossmart does not store buyer data yet.                                      |
| `shop/redact`                                | Wipes credentials, settings and scopes, and deletes the store's listing mappings. Products stay. |

Webhook URLs must be public HTTPS, so receiving webhooks locally needs a tunnel (for example
`cloudflared tunnel --url http://localhost:3000`).

## Local development

1. Set the redirect URL to `http://localhost:<API_PORT>/api/v1/channels/shopify/oauth/callback`.
   Shopify's documentation does not say whether it accepts plain `http://localhost` redirect URLs.
2. If the Dev Dashboard refuses that URL, start a tunnel to the API, set `API_PUBLIC_URL` to the
   tunnel's HTTPS URL, and register `https://<tunnel>/api/v1/channels/shopify/oauth/callback`.
   You also need the tunnel to receive webhooks.
3. Install on a development store: open Channels, click **Connect** on Shopify and enter the
   store's domain.

## Security

- The OAuth `state` is HMAC-signed with a key derived from `BETTER_AUTH_SECRET`. It names the
  workspace, user and store, and expires after 10 minutes. On the callback, the state must verify
  and must not belong to a different signed-in user. The user must still manage the workspace,
  and Shopify must answer for the store named in the state.
- The callback HMAC and webhook HMACs are compared in constant time.
- Credentials are sealed with AES-256-GCM using a per-workspace data key, which is wrapped by
  `CREDENTIALS_MASTER_KEY`. The ciphertext is bound to the workspace, channel and store.
  Credentials are never logged and never returned by the API.
