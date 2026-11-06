# n8n

`n8n-nodes-crossmart` is the official [n8n](https://n8n.io) community node package for Crossmart.
It lives in [`integrations/n8n`](../../integrations/n8n/README.md) and has three nodes:

- **Crossmart:** products, stock, listings, orders and stores. It can also be a tool of n8n's AI
  Agent.
- **Crossmart Trigger:** starts a workflow the moment Crossmart sends an event (orders, stock,
  listings, products), through a webhook.
- **Crossmart Polling Trigger:** the fallback when Crossmart cannot reach n8n. It checks the API
  on a schedule for new orders, stock changes and failed listings.

## Install

In n8n, open **Settings → Community nodes → Install** and enter `n8n-nodes-crossmart`.

## Credentials

Add a **Crossmart API** credential with a workspace API key (dashboard: **Settings → API keys**)
and, if you self-host Crossmart, your API's base URL. The default is `https://api.crossmart.io`;
a trailing slash or `/api/v1` is fine. n8n tests the credential with `GET /api/v1/api-key`, and
the nodes use the same call to find the key's workspace, so there is no workspace field to fill.

Use a key for n8n alone, with the smallest role that works (see [roles](README.md#api-keys)):

| What the workflow does                                                      | Role                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| Reads products, stock, orders; runs the **Crossmart Polling Trigger**       | `VIEWER`                                         |
| Creates and updates products, adjusts stock, publishes and retries listings | `EDITOR`                                         |
| Syncs stores                                                                | `ADMIN`                                          |
| Runs the **Crossmart Trigger** (creates and deletes its webhook endpoint)   | `ADMIN`, or a custom role with `webhooks:manage` |

## Examples

- **Restock from a purchase order:** a Google Sheets trigger → **Inventory → Get by SKU** →
  **Inventory → Adjust Stock** (mode _Add or Remove_, reason _Received_, note = the PO number).
- **Alert on failed listings:** **Crossmart Trigger** (_Listing Failed_) → Slack, with
  `{{$json.data.listing.channel}}` and `{{$json.data.listing.lastError}}`; then fix the product
  and run **Listing → Retry** with `{{$json.data.listing.productId}}` and
  `{{$json.data.listing.connectionId}}`.
- **Orders to a spreadsheet:** **Crossmart Trigger** (_Order Created_) → Google Sheets, one row
  per order from `{{$json.data.order.name}}`, `{{$json.data.order.total}}` and
  `{{$json.data.order.lines}}`.
- **Low stock report:** Schedule → **Inventory → Get Many** (stock level _Low Stock_, Return All)
  → email.

## How the triggers work

### Crossmart Trigger (webhooks)

The trigger uses Crossmart's [outgoing webhooks](webhooks.md), where the event catalog, payloads
and signature scheme are documented:

1. **Activate the workflow.** n8n asks the node whether its endpoint exists
   (`GET /webhook-endpoints/{id}`): it must still exist, be enabled, and point at this workflow's
   webhook URL with the chosen events. If not, the node deletes the endpoint it made before, if
   any, and creates a new one: `POST /webhook-endpoints` with the URL, the events and the
   description `n8n workflow <name> (<id>)`. It keeps the endpoint id and the signing secret
   (shown only once) in the workflow's static data.
2. **Receive events.** Each delivery is a `POST` of the event envelope
   `{ id, type, createdAt, workspaceId, apiVersion, data }`. The node checks the
   `Crossmart-Signature` header (`t=<unix seconds>,v1=<hex>`, more than one `v1` during a secret
   rotation): an HMAC-SHA256 keyed with the whole secret over `<t>.<raw body>`, compared in
   constant time, at most 300 seconds from n8n's clock. A delivery that fails gets `401` and does
   not run the workflow. Events the user did not pick are acknowledged and dropped; `webhook.test`
   always runs it. Delivery is at least once, so the node remembers the last 100 event ids and
   drops repeats. The workflow gets one item per event: the whole envelope.
3. **Deactivate the workflow.** n8n deletes the endpoint (`DELETE /webhook-endpoints/{id}`; one
   already deleted in Crossmart counts as deleted) and the node forgets its secret.

Creating the endpoint fails with a clear message when the key lacks `webhooks:manage` (403), the
plan's endpoint limit is reached (402), or Crossmart rejects the URL (400: Crossmart Cloud only
delivers to public `https` URLs). n8n behind a proxy must set `WEBHOOK_URL` to its public URL.

**Versions.** The node type `crossmartTrigger` is versioned. Version 1 is the polling trigger of
package 0.1, and n8n keeps running saved workflows with the version they were saved with, so they
keep polling after an upgrade. New nodes are version 2, the webhook trigger. n8n cannot give one
node both a poll and a webhook, so polling for new workflows is its own node, the Crossmart Polling
Trigger, which shares version 1's code.

### Crossmart Polling Trigger

The polling trigger reads the REST API on the interval set in n8n and remembers what it has seen
in the workflow's static data:

| Event          | Reads                                                                                                   | Dedupe                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| New Order      | `GET /orders?direction=desc`, page after page until a known order                                       | The last 1,000 order ids                                       |
| Stock Changed  | `GET /inventory-items?sort=updated_at&direction=desc` until the watermark                               | A watermark: the latest `updatedAt` emitted, and the ids at it |
| Listing Failed | `GET /channel-connections`, then `GET …/listings?status=ERROR` for each store with `failedListings > 0` | The failing listings (id and error) of the previous check      |

The first check after activation records the starting point and emits nothing, so activating a
workflow does not replay history. A listing that recovers and fails again, or fails again with
another error, is emitted again. One check reads at most 10 pages, so a very long pause cannot
make it run for ever. Use it when Crossmart cannot reach n8n, such as n8n on a laptop or on a
private network.

## API gaps

The nodes use only endpoints that exist today. These gaps shape them, and closing them would make
them simpler and cheaper to run:

1. **No "changed since" filters.** Orders, inventory items and listings have no
   `createdAfter`/`updatedAfter` filter, so the trigger pages newest-first and dedupes in static
   data. Orders sort by `placedAt`, so an order a store reports late, with an older placing date
   than the last 1,000 orders, can be missed. This affects the polling trigger only.
2. **No workspace-wide list of failed listings.** Listings are listed per store, so the polling
   trigger's _Listing Failed_ makes one request per store that reports failures. Store summaries carry
   `failedListings` but no "last failed at", so a store's failures are read in full each check.
3. **Listings have no `updatedAt`.** A listing failing again with the same error after a retry
   cannot be told apart from one that kept failing, unless it recovered in between.
4. **No inventory item by id or by SKU.** _Get by SKU_ searches (which also matches titles and
   partial SKUs) and keeps exact matches. There is no `GET /inventory-items/{id}`.
5. **No partial product update.** `PUT /products/{id}` replaces the product, so _Update_ reads it
   first and sends it back whole. A `PATCH` would avoid the extra request and a lost update when
   two writers race.
6. **Stock changes are per inventory item, not per movement.** The polling trigger's _Stock
   Changed_ emits the item's current stock, not each movement. The movements endpoint is per
   item, with no workspace-wide feed. (The webhook's `inventory.stock_changed` carries
   `availableDelta` and `reason`.)

## Publishing and n8n verification

The package is not on npm yet. Before it is published and submitted to n8n's
[verified community nodes](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/),
the owner has to settle:

- **License.** Decided: the package is MIT (`integrations/n8n/LICENSE.md`), as n8n's verified
  community nodes require. The rest of the repository stays AGPL-3.0
  ([ADR 0003](../decisions/0003-license.md)).
- **npm account and provenance.** Since May 2026, n8n requires community nodes to be published
  from a GitHub Action with an npm provenance statement, and checks that the npm package's
  repository and maintainer match GitHub. That needs an npm account or organization for
  Crossmart, trusted publishing for this repository, and a publish workflow for
  `integrations/n8n` (the repository runs CI locally today).

The rest of the checklist is met: no runtime dependencies (the nodes call the API through n8n's
`httpRequestWithAuthentication`), no environment or file access, English only, built and linted
with `@n8n/node-cli`, a credential test, and triggers in the programmatic style (the webhook
trigger implements the full `checkExists`/`create`/`delete` lifecycle and verifies signatures with
`node:crypto`, which verified nodes may use). Run
`npx @n8n/scan-community-package n8n-nodes-crossmart` once the package is on npm.

## Develop

```bash
cd integrations/n8n
pnpm install
pnpm build && pnpm lint && pnpm typecheck && pnpm test
pnpm dev   # starts n8n with the nodes loaded
```

The package is standalone, like `sdks/typescript`: it has its own lockfile and is not part of the
root install, so n8n's tooling stays out of the backend's dependencies. It does not use the
TypeScript SDK, because verified nodes may not have runtime dependencies; its routes and types
follow the SDK's names. The node is programmatic rather than declarative, because updating a
product takes two requests, every route needs the key's workspace id, and triggers must be
programmatic anyway. The trigger's versions live in `nodes/CrossmartTrigger/v1` (polling) and
`v2` (webhooks), n8n's layout for versioned nodes.
