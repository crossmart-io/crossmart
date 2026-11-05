# Crossmart: Architecture

Status: initial design (2026-10-31). Decisions are recorded in [decisions/](decisions/).

## 1. System overview

```
                 ┌──────────────┐     ┌──────────────┐
  Merchant ────► │ crossmart-web│     │ Claude/ChatGPT│ (merchant's own agent)
                 │  React SPA   │     │   via MCP     │
                 └──────┬───────┘     └──────┬────────┘
                        │ REST /api/v1       │ MCP → REST
                        ▼                    ▼
                 ┌─────────────────────────────────┐
                 │            apps/api             │  NestJS
                 │ auth · catalog · inventory ·    │
                 │ orders · suggestions · billing  │
                 └──────┬───────────────┬──────────┘
                        │ Prisma        │ enqueue jobs
                        ▼               ▼
                 ┌────────────┐   ┌───────────┐
                 │ PostgreSQL │◄──┤apps/worker│  NestJS + BullMQ
                 │  (RLS)     │   │ sync · AI │
                 └────────────┘   └─────┬─────┘
                        ▲               │ libs/connectors/*
                        │         ┌─────▼──────────────────────────┐
                        │         │ Shopify · eBay · Etsy · Google │
       webhooks ────────┴─────────┤ Amazon SP-API · Walmart · ...  │
       (apps/api/webhooks)        └────────────────────────────────┘
```

- **apps/api**: the REST API (and the only writer of business state from user actions). It also receives channel webhooks.
- **apps/worker**: runs BullMQ processors for channel sync, order polling, reconciliation and AI agent jobs. It shares the same domain modules as the API.
- **apps/mcp**: an MCP server (stdio + streamable HTTP) that maps tools to REST calls, authenticated with a workspace API key.
- **crossmart-web**: a separate repo containing a React SPA that consumes the generated OpenAPI client.

## 2. Backend repository layout (`crossmart`)

```
crossmart/
├── apps/
│   ├── api/                 # NestJS HTTP app (controllers, guards, webhooks)
│   ├── worker/              # NestJS app with BullMQ processors
│   └── mcp/                 # MCP server
├── libs/
│   ├── core/                # domain modules (shared by api + worker)
│   │   ├── activity/        # activity log: who changed what, ActivityRecorder
│   │   ├── catalog/         # products, variants, listings, channel content
│   │   ├── inventory/       # ledger, reservations, policies
│   │   ├── orders/
│   │   ├── channels/        # channel connections, sync orchestration
│   │   ├── suggestions/     # suggestion engine, autonomy policies
│   │   ├── ai/              # AiProvider abstraction, prompts, metering
│   │   ├── tenancy/         # organizations, workspaces, members, roles
│   │   ├── entitlements/    # plans, limits, feature flags
│   │   └── billing/         # BillingProvider abstraction (Stripe impl)
│   ├── connectors/
│   │   ├── sdk/             # Connector interfaces, base classes, test kit
│   │   ├── shopify/
│   │   ├── ebay/
│   │   └── ...
│   ├── common/              # utils, constants, errors, logging, crypto
│   └── database/            # Prisma schema, client, migrations
├── docker-compose.yml       # full self-host stack (api, worker, web, pg, redis)
├── Dockerfile.*             # same images used by Railway cloud
└── openapi.json             # published per release (consumed by crossmart-web)
```

Each domain module follows the NestJS feature layout:
`<module>.module.ts`, `controllers/`, `services/`, `repositories/`, `dto/`, `entities/`, `enums/`, `<module>.constants.ts`.

Services that change workspace data record it in the activity log. They import `ActivityModule`, inject
`ActivityRecorder` and call `record(workspaceId, actor, entry)` after the write, or `recordFailure(...)` when an
operation worth reporting fails. Controllers pass the caller down as an `Actor` (`@CurrentActor()`). Recording never
throws, so a log that cannot be written never fails the operation. A new action is a value in `ActivityAction` plus its
wording in `activity-summary.ts`; actions are stored as text, so this needs no migration. A product's history is every event whose subject ids include it, whatever the event's subject: an import is about its `ImportJob`, and lists the products it created or changed.

## Plans and entitlements

Plans are data (ADR [0015](decisions/0015-plans-and-entitlements.md)), in `libs/core/src/entitlements`:

```
Plan (code, name, active, isDefault, sortOrder)
 └─ PlanVersion (version) ── PlanFeature (feature, enabled, limit: null = unlimited)
Organization ── OrganizationSubscription (planVersion, status, currentPeriodEnd?,
                                          externalCustomerId?, externalSubscriptionId?)
```

- **Grandfathering.** A plan changes by adding a version. New organizations get the latest version
  of the default plan; existing ones keep the version they are on until moved explicitly.
- **Features.** `Feature` names every limit and flag; `FEATURE_KINDS` says which is which. A feature
  a version does not list is not included, so a migration adding a feature gives every version a row.
- **Seeded plans** (a starting point, to validate with design partners; Enterprise is custom):

  | Feature               | Free | Starter | Growth | Agency |
  | --------------------- | ---: | ------: | -----: | -----: |
  | `active_listings`     |   50 |   1,000 | 10,000 | 50,000 |
  | `channel_connections` |    2 |       ∞ |      ∞ |      ∞ |
  | `workspaces`          |    1 |       1 |      1 |     25 |
  | `members`             |    2 |       5 |     15 |      ∞ |
  | `api_keys`            |    2 |      10 |     25 |    100 |
  | `ai_credits` / month  |  100 |   1,000 |  5,000 | 20,000 |
  | `autonomous_agents`   |    — |       — |      ✓ |      ✓ |
  | `bring_your_own_key`  |    — |       — |      — |      ✓ |

- **Usage** is counted from the data across the organization's workspaces, one aggregate query per
  feature: listings with status `ACTIVE`, connections not `DISCONNECTED`, workspaces, distinct
  members, API keys neither revoked nor expired. `ai_credits` reports 0 until AI calls record usage:
  connect it in `UsageMeter` (sum the period's credits from the AI usage table).
- **`EntitlementService`** offers `limit`, `usage`, `check` (always truthful) and `assert` (throws
  `EntitlementExceededException`, HTTP 402 with `code`, `feature`, `limit`, `usage`, `requested`, only
  while `ENTITLEMENTS_ENFORCED=true`; default false until billing exists).
- **Where limits apply:** creating a workspace; issuing an API key; inviting someone new to the
  organization (members); starting a channel connection and storing it on the OAuth callback (a
  reconnect takes no new slot; a refusal at the callback redirects with `error=plan_limit_reached`);
  and listings. For listings, the API refuses a publish, a selection rule or products added by hand
  before writing anything when the products that would go live do not fit (`ActiveListingsGate`),
  and the worker checks each listing it is about to make live: a blocked one is not sent and is
  marked `ERROR` with the reason.
- `GET /api/v1/organizations/{id}/subscription` returns the plan, `enforced`, and every feature
  with its limit and usage, for members holding `billing:view` (owners and admins).

## 3. Core domain model (initial)

```
Organization ─┬─ OrganizationSubscription (plan version, status, provider ids)
              └─ Workspace ─┬─ Member (user, role)
                            ├─ ApiKey
                            ├─ ChannelConnection (channel, credentials[encrypted], status, settings)
                            ├─ Product ─┬─ Variant (sku, gtin, price, cost, attributes JSONB)
                            │           │    └─ InventoryItem ── InventoryMovement (ledger)
                            │           ├─ ProductContent (base: title, description, bullets, attributes)
                            │           ├─ Media
                            │           └─ Listing (per connection) ─┬─ ListingOverride (ChannelContent)
                            │                                        ├─ ListingVariantOverride (fixed price)
                            │                                        ├─ ListingVariant (external ids)
                            │                                        ├─ external id, status, last error
                            │                                        └─ last synced, media digest
                            ├─ Order ── OrderLine (variant, qty, channel order id)
                            ├─ Suggestion (agent, target, diff, rationale, status)
                            ├─ AutonomyPolicy (action type → auto | ask)
                            ├─ InventoryPolicy (buffer, low-stock threshold, primary channel, allocation)
                            ├─ ImportJob / SyncJob
                            ├─ AuditLog (actor: user | agent | api | sync)
                            └─ UsageRecord (listings, ai credits, api calls)
```

Key rules:

- `workspace_id` lives on every tenant table, and Postgres RLS enforces it as defence in depth.
- Channel-specific attributes are stored as JSONB, validated by the connector's schema.
- Every state change by an agent goes through `Suggestion` and is then applied by the same service a user would call.
- A variant's `cost` is what the merchant pays per unit. It drives pricing floors, is sent to channels that keep it for margin reports (Shopify's "Cost per item"), and is never shown to buyers. Shopify CSV files may carry it in an optional `Cost per item` column.
- Stock on hand is derived from the ledger (`InventoryMovement`). Each `InventoryItem` stores `available` (what can be sold, and what channels receive) and `reserved` (held for open orders); on hand = available + reserved. Both columns are updated atomically with the ledger, and every movement records the stock on hand after it, its reason and its author. The author is the same `Actor` the activity log credits (a user or an API key), and manual adjustments also appear as `inventory_adjusted` events in the product's activity. Every stock change goes through the inventory module: manual adjustments, product edits and inventory file imports (`StockLevelsService`, reason `IMPORTED`) all write the same ledger.

## 4. Connector SDK

Each connector implements a set of capability interfaces, so the orchestrator only calls what a channel supports:

```ts
interface ChannelConnector {
  readonly channel: ChannelType;
  readonly capabilities: ReadonlySet<ChannelCapability>;
  readonly auth: ChannelAuthStrategy;          // OAuth app | seller-provided credentials
}
interface ListingPublisher   { publish(...); update(...); delist(...); updatePrices(...); }
interface TaxonomyProvider   { suggestCategories(...); }
interface InventoryUpdater   { setQuantities(batch: InventoryUpdate[]): Promise<...>; }
interface OrderSource        { fetchOrders(since): ...; parseWebhook(payload): ...; }
interface FulfillmentSink    { pushTracking(...): ...; }
interface CatalogImporter    { importProducts(cursor): ...; }
interface TaxonomyProvider   { searchCategories(...); requiredAttributes(categoryId); }
```

- **Code:** `libs/connectors/src/sdk` holds the interfaces (`ChannelConnector`, `OAuthAppConnector`, `SellerCredentialsConnector`, and the capability interfaces `WebhookReceiver`, `CatalogSource`, `ListingPublisher`, `InventorySync`, `OrderSource`, `TaxonomyProvider`), the `ChannelConnectorRegistry`, the `HttpTransport` abstraction and the test kit (`FakeHttpTransport`, fixtures, `describeConnectorContract`). `supportsCapability(connector, capability)` narrows a connector to the capability's interface. Core services open authenticated `ChannelSession`s with `ChannelSessionFactory`, which refreshes expiring tokens under a Postgres advisory lock. Shopify is documented in [channels/shopify.md](channels/shopify.md) and eBay in [channels/ebay.md](channels/ebay.md). A `ListingDraft` carries the connection's account settings and the listing's channel category for channels that need them (eBay), and `delist` receives a `ListingReference` (product id and variant ids on the channel).
- **Rate limiting:** each connector declares its rate-limit buckets, and the worker uses per-connection BullMQ limiters.
- **Priority queues:** `inventory` > `orders` > `price` > `content` > `import`. Each is its own BullMQ queue with its own worker concurrency, so stock never waits behind a publish.
- **Credentials:** encrypted with envelope encryption: AES-256-GCM with a data key per workspace (`workspace_data_keys`), wrapped by `CREDENTIALS_MASTER_KEY` with a key version for rotation. Each value is bound to its workspace, channel and account. They are never logged and never returned by the API.
- **Feed channels:** a generic template-based feed exporter (XML/CSV/TSV), so most simple channels are configuration only.
- A **test kit** of recorded fixtures and contract tests is required for every connector PR.

## 5. Sync & inventory flows

## 5. Sync & inventory flows

**Listings, pricing and selection** (`libs/core/src/listings`)

- **Product selection.** A connection's `settings.productSelection` names the products it lists: those matching
  `filter` (the catalog list filters: search, status, gap, tags, vendor), plus `includeProductIds`, minus
  `excludeProductIds` (exclusion wins). A null filter matches nothing, so only the included products are listed; no
  selection lists every product. `ProductSelectionService` evaluates it with the same Prisma condition as the product
  list (`toProductListWhere`), so a filter selects the same products everywhere. The schema allows several listings
  per product per connection (for eBay later); the sync works on a product's oldest ("primary") listing.
- **Pricing rule.** `settings.pricing` holds a typed, validated rule: an adjustment percent (−90 to 500), a fixed
  amount, a rounding (`none`, `.99`, `.95`, `whole`; charm endings round _up_, and fall back to whole amounts for
  zero-decimal currencies), an optional floor of cost plus a minimum margin, and what to do with compare-at prices
  (adjust like the price, keep, or omit).
- **Price resolution.** `ChannelPriceResolver` is pure. A manual price on the listing wins, then the connection's
  rule, then the variant's base price. It works in exact decimals (`FixedDecimal` in `libs/common`, never floats),
  in the channel's currency precision, and returns the steps with a one-line explanation:
  `$89.00 → +15% → .99 = $102.99`, or `$50.00 → -10% → .99 → floor $52.00 (cost $40.00 + 30%) = $52.99`. Warnings
  flag a floor that could not apply (no cost), a manual price below the floor, and a compare-at price that is not
  above the price (it is dropped, as channels show no sale then).
- **Currency conversion.** Catalog prices are in the workspace's currency. When a store sells in another one,
  `PricingContextFactory` adds a conversion and the resolver converts price, compare-at and cost before the rule:
  `$10.00 → × 0.92 (USD → EUR) → +10% → .99 = €10.99`. The rate is the rule's `fixedExchangeRate` when set, else the
  European Central Bank's latest daily reference rate (`libs/core/src/currency`): stored in `exchange_rates`, any pair
  converted through the euro, refreshed on use when older than a day. Manual prices are already in the store's
  currency and are not converted. Without a rate the price is flagged `no_exchange_rate`, shown unconverted in
  previews, and a sync refuses to send it.
- **Overrides (ChannelContent).** `ListingOverride` holds what one listing shows differently: title, description,
  tags, a subset and order of the product's images (by URL, so they survive image re-uploads), visibility (show or
  hide on this channel whatever the product's status), an inventory buffer and a maximum shown quantity.
  `ListingVariantOverride` holds fixed prices per variant. Typed columns, no JSON. Null follows the product.
- **Channel category.** On channels with categories (eBay), `Listing.channelCategoryId` / `channelCategoryName` hold
  the category the listing is in: chosen by the merchant, or picked on first publish and saved from the
  `PublishedListing`. It lives on the listing, not the override, because it is not catalog content: removing a
  listing's overrides keeps it.
- **Shown stock** is `available − buffer`, never below zero, capped by the maximum.

**Sync jobs.** The API enqueues, `apps/worker` runs them (`ListingSyncRunner`):

| Job       | Queue       | What it does                                                                       |
| --------- | ----------- | ---------------------------------------------------------------------------------- |
| inventory | `inventory` | Sets the shown stock of a listing's tracked variants, in `maxBatchSize` batches    |
| price     | `price`     | Sends channel prices only                                                          |
| content   | `content`   | Publishes the product, or updates the listing the channel holds (never duplicates) |
| delist    | `content`   | Takes the listing off the channel (Shopify: archives; eBay: withdraws the offers)  |

Jobs are keyed per kind, connection and product, and debounced (2 s for stock, 5 s for prices, 10 s for content):
a newer job replaces the waiting one, so a burst of edits becomes one call. Jobs send current state, so coalescing
loses nothing. The worker paces calls per connection with the connector's rate-limit buckets (a job that must wait
goes back to the delayed set) and retries outages and rate limits with exponential backoff; rejected input marks
the listing `ERROR` with the channel's message in `lastError`.

Triggers:

- **Publish / Sync now** (`POST …/channel-connections/:id/sync`): every selected product gets a pending listing and a
  content job; every listing the channel holds for a product no longer selected gets a delist job.
- **Catalog changes** go through the in-process `CatalogEventBus`, so the catalog does not depend on channels: a
  product edit queues content and stock, a bulk status or tag change queues content, a bulk price change and a CSV
  update import queue content or prices. Only listings the channel already holds are synced; new products wait for
  "Publish".
- **Stock changes** (adjustments, inventory imports, product edits) fan out inventory jobs only to the listings of
  the touched stock items.
- **Overrides** queue a content and a stock update when the channel holds the listing.

**Order → inventory (overselling protection)**

1. A webhook or poller receives an order and upserts it by `(channel, external_order_id)` (idempotent).
2. In one transaction, `InventoryMovement(-qty, reason=ORDER)` is written and `available` is decremented with a conditional update.
3. Fan-out jobs are enqueued on the `inventory` priority queue for every other listing of that variant.
4. The inventory policy (buffer, low-stock lock to the primary channel, allocation) computes the quantity per channel.
5. If `available < 0`, an `OversellIncident` and a resolution `Suggestion` are created.

**Channel catalog import:** the API records an `ImportJob` (format `shopify_api`, mode `create_or_link`) and queues it on `import`. The worker reads the catalog through the connector's `CatalogSource` page by page, links or creates products, writes listings with their variant ids, sets new stock through the ledger, and stores the cursor with each page's counts, so retries resume. See [channels/shopify.md](channels/shopify.md#catalog-import).

**Reconciliation:** inventory every 15 minutes and everything else daily. The job compares each channel's state to Crossmart and corrects drift, logging what it changed. Today the inventory reconciliation is a BullMQ job scheduler on the `inventory` queue that re-sends the shown stock of every listing of every connected account; comparing with the channel's own quantities first, and the daily content reconciliation, come later.

**AI checkout channels (ACP):** a reservation with a TTL is made before payment, then confirmed or released.

## 6. AI layer

- An `AiProvider` interface with adapters for Anthropic, OpenAI, Gemini and Ollama. The model is chosen per task.
- Prompts are versioned files in `libs/core/ai/prompts`, one per agent and channel. They are never inline strings.
- Output goes through structured schemas (zod/class-validator), so free-text JSON is never trusted.
- Every call writes a `UsageRecord` (tokens, cost, credits) for credits and entitlements.
- Credentials: platform keys in the cloud, or a BYOK key per workspace (encrypted like channel credentials).

## 7. API & clients

- REST, versioned at `/api/v1`, with OpenAPI generated from `@nestjs/swagger` decorators.
- `openapi.json` is published per release, and `crossmart-web` generates its typed client from it. The web CI fails on breaking changes.
- Auth uses Better Auth sessions (web) or workspace API keys (API/MCP). Rate limited per key.
- Errors use one consistent shape (RFC 9457 problem+json) with typed error codes from an enum.

## 8. Security

- Tenant isolation: workspace guard + RLS.
- Secrets: envelope encryption, no secrets in logs, and redacting logger serializers.
- Webhook signature verification for every channel.
- Least-privilege OAuth scopes. Buyer PII is minimised and purged on a schedule (an Amazon requirement).
- Audit log for every write by users, agents and the API.
- Dependency scanning (Dependabot), CodeQL, `SECURITY.md` with a disclosure policy.

## 9. Deployment

- **Self-host:** `docker compose up` brings up api, worker, web, postgres and redis. Configuration is via env, telemetry is opt-out.
- **Cloud:** Railway (US East), using the same Docker images, with `staging` and `production` environments, a static egress IP, managed Postgres with PITR plus a daily off-site dump to S3/R2.
- **CI (GitHub Actions):** lint, typecheck, unit + contract tests, build and push images to GHCR, publish `openapi.json` on release.

## 10. Telemetry (self-hosted)

A daily anonymous ping containing a random instance id, the version, connector counts by type and a listing-count bucket. It never includes product, order, customer or credential data. Disable it with `CROSSMART_TELEMETRY=false`. The exact payload is documented at `docs/telemetry`.
