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
│   │   ├── media/           # product image uploads, storage quota, orphan cleanup
│   │   ├── inventory/       # ledger, reservations, policies
│   │   ├── orders/
│   │   ├── channels/        # channel connections, sync orchestration
│   │   ├── suggestions/     # suggestion engine (review, apply, stale check); autonomy policies later
│   │   ├── ai/              # AiProvider abstraction, AiGateway, prompts, metering
│   │   ├── content-generation/ # the Content Generator agent and its channel rules
│   │   ├── ask/             # Ask Crossmart: docs knowledge index, retrieval, grounded answers
│   │   ├── webhooks/        # outgoing webhooks: endpoints, outbox, dispatch, delivery (ADR 0023)
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
- **Seeded plans:** the Crossmart Cloud lineup of ADR [0020](decisions/0020-plan-lineup.md), each
  plan's latest version. New organizations start on Starter (`isDefault`). Free and Agency are legacy
  (`active` false): not offered, kept by the organizations on them. Enterprise is sold by contract,
  and its version 1 is the floor a contract starts from. Prices are not stored here; billing owns them.

  | Feature               | Starter |   Pro | Growth |  Scale | Enterprise |
  | --------------------- | ------: | ----: | -----: | -----: | ---------: |
  | `active_listings`     |   1,000 | 3,000 | 10,000 | 50,000 |    100,000 |
  | `channel_connections` |       3 |     5 |     10 |      ∞ |          ∞ |
  | `workspaces`          |       1 |     1 |      2 |      5 |          ∞ |
  | `members`             |       2 |     5 |     10 |     25 |          ∞ |
  | `api_keys`            |       5 |    10 |     25 |    100 |          ∞ |
  | `webhook_endpoints`   |      10 |    20 |     50 |    200 |          ∞ |
  | `ai_credits` / month  |     300 | 1,500 |  5,000 | 20,000 |     20,000 |
  | `autonomous_agents`   |       ✓ |     ✓ |      ✓ |      ✓ |          ✓ |
  | `bring_your_own_key`  |       — |     — |      — |      ✓ |          ✓ |

- **Usage** is counted from the data across the organization's workspaces, one aggregate query per
  feature: listings with status `ACTIVE`, connections not `DISCONNECTED`, workspaces, distinct
  members, API keys neither revoked nor expired. `ai_credits` counts the organization's `ai_usage` rows
  in the current UTC calendar month times `AI_CREDITS_PER_CALL` (1: every call is one credit, whatever its
  size). Pricing per token may replace it later from the same rows, and the period may follow the billing
  period once billing is connected.
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
- **Sandbox accounts** (ADR [0019](decisions/0019-agent-access.md), part 2). An organization with
  an unclaimed `SandboxAccount` row was opened by an AI agent (`libs/core/src/sandbox`). Its rules
  apply whatever `ENTITLEMENTS_ENFORCED` says: `EntitlementService.assertSandboxAllows` (by
  workspace) and `assertSandboxAllowsInOrganization` refuse a `SandboxRestriction` (connect a
  channel, publish, invite, add a workspace, Crossmart AI) with `SandboxRestrictedException`, HTTP
  403 `sandbox_claim_required`, and `assertProductRoom` caps products at `SANDBOX_MAX_PRODUCTS` (100).
  The callers are `ChannelConnectionQuota`, `ActiveListingsGate`, `InvitationPolicy`,
  `WorkspacesService`, `AiGateway`, `ProductAdmission` and the create-products import. Claiming
  sets `claimedAt`, which lifts them all; the hourly maintenance sweep (`SandboxSweeper`) sends the
  one reminder and deletes expired sandboxes.
- `GET /api/v1/organizations/{id}/subscription` returns the plan (`offered` is false on a legacy
  plan), `enforced`, and every feature with its limit and usage, for members holding `billing:view`
  (owners and admins).
- **Billing** (ADR [0024](decisions/0024-billing.md), [billing.md](billing.md)): `libs/core/src/billing`
  sells the plans through a `BillingProvider` (Stripe; off with `BILLING_DRIVER=none`, as
  self-hosting runs). Prices are found by lookup key (`crossmart_<plan>_<interval>`), never stored.
  Webhooks update the organization's subscription row, and so the plan `EntitlementService` reads.
  `SubscriptionAccessPolicy` makes an organization without a subscription in good standing
  read-only (402 `subscription_inactive`, from the global `SubscriptionWriteGuard`), only while
  billing and `ENTITLEMENTS_ENFORCED` are both on.

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
                            ├─ Suggestion (target product + connection, kind, current/proposed value, rationale, status)
                            ├─ AiUsage (feature, provider, model, input/output tokens)
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
  readonly contentLimits?: ChannelContentLimits; // title/description limits, for generated content
}
interface ListingPublisher   { publish(...); update(...); delist(...); updatePrices(...); }
interface TaxonomyProvider   { suggestCategories(...); }
interface InventoryUpdater   { setQuantities(batch: InventoryUpdate[]): Promise<...>; }
interface OrderSource        { fetchOrders(since): ...; parseWebhook(payload): ...; }
interface FulfillmentSink    { pushTracking(...): ...; }
interface CatalogImporter    { importProducts(cursor): ...; }
interface TaxonomyProvider   { searchCategories(...); requiredAttributes(categoryId); }
```

- **Code:** `libs/connectors/src/sdk` holds the interfaces (`ChannelConnector`, `OAuthAppConnector`, `SellerCredentialsConnector`, and the capability interfaces `WebhookReceiver`, `CatalogSource`, `ListingPublisher`, `InventorySync`, `OrderSource`, `TaxonomyProvider`), the `ChannelConnectorRegistry`, the `HttpTransport` abstraction and the test kit (`FakeHttpTransport`, fixtures, `describeConnectorContract`). `supportsCapability(connector, capability)` narrows a connector to the capability's interface. Core services open authenticated `ChannelSession`s with `ChannelSessionFactory`, which refreshes expiring tokens under a Postgres advisory lock. Shopify is documented in [channels/shopify.md](channels/shopify.md), eBay in [channels/ebay.md](channels/ebay.md), Google Merchant Center in [channels/google-merchant.md](channels/google-merchant.md) ([ADR 0017](decisions/0017-google-merchant-connector.md)) and Etsy in [channels/etsy.md](channels/etsy.md) ([ADR 0021](decisions/0021-etsy-connector.md)). The SDK also has PKCE (`pkceS256Challenge`; core derives each connection's verifier from its OAuth state nonce), form and multipart bodies on `JsonApiClient`, and `ImageFetcher` for channels that take image files rather than links (`HttpsImageFetcher` downloads only `https` images from public addresses). Sessions also carry the connection's stored account settings (`ChannelSession.settings`) for channels that address listings through them (Google's data source). A `ListingDraft` carries the connection's account settings and the listing's channel category for channels that need them (eBay), and `delist` receives a `ListingReference` (product id and variant ids on the channel).
- **Shared building blocks:** connectors build on the SDK instead of copying each other.
  - `OAuthTokenEndpoint` (`sdk/oauth`) is an RFC 6749 token endpoint: the code exchange, the refresh and other grants
    (eBay's client credentials), with client authentication as HTTP Basic (eBay) or in the form body (Google). A 5xx
    is `ChannelUnavailable`, an `invalid_grant` on a refresh is `CredentialsRejected`, and any other refusal is
    `RequestRejected` naming only the OAuth `error` code. A code exchange answers an `OAuthTokenGrant`
    (`ChannelCredentials` plus the scopes the response lists, or null when it lists none); a refresh answers
    `ChannelCredentials` and keeps the stored refresh token, since eBay and Google do not rotate them. `OAuthParam`,
    `OAuthGrantType` and the OAuth constants live there too. Shopify's OAuth is shop-scoped, HMAC-verified and rotates
    refresh tokens, so it keeps its own client.
  - `JsonApiClient` (`sdk/http`) calls a JSON API with a user's bearer token and validates each response with a zod
    schema. A connector extends it with where a request goes (`url`), how its error body reads (`describeFailure`:
    the `ChannelErrorCode` and a safe detail, or an exact message) and a merchant-readable message per code;
    transport failures and unexpected bodies are `ChannelUnavailable`. eBay adds its language headers, and Google
    reads `google.rpc.Status`.
  - `contentLimits` (`ChannelContentLimits`, optional on `ChannelConnector`) declares the title limit, the hard
    description limit, the description length worth writing (eBay: 500,000 hard, 4,000 written), the
    `DescriptionFormat` and whether links are allowed. Core's AI content rules take their numbers from here.
- **Rate limiting:** each connector declares its rate-limit buckets, and the worker uses per-connection BullMQ limiters.
- **Priority queues:** `inventory` > `orders` > `price` > `content` > `import` > `ai`. Each is its own BullMQ queue with its own worker concurrency, so stock never waits behind a publish, and AI agents never hold up a sync. Outgoing webhooks have their own `webhooks` queue.
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
  content job; every listing the channel holds for a product no longer selected gets a delist job. `SyncRequestQueue`
  stamps each queued listing's `syncRequestedAt` before its job is queued, and `ListingSyncRunner` clears it when the
  content or delist job finishes or the queue gives up, so a selected listing shows `publishing` meanwhile and
  `GET …/sync` counts what is left. A per-listing mark, not a sync run id: jobs coalesce per listing (a later edit
  replaces a queued job), so only the listing knows whether its latest job ran. A retry marks its listing the same way.
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

**Outgoing webhooks** (`libs/core/src/webhooks`, [ADR 0023](decisions/0023-outgoing-webhooks.md)).
Services that change orders, stock, listings or products call `WebhookOutbox.publish(tx, …)` in
the transaction that writes the change: the `webhook_events` row and one `webhook_deliveries` row
per subscribed, enabled endpoint commit with it (the outbox), and nothing is written when no
endpoint listens. The order writer, the inventory ledger, the product repositories and the
listing sync repository publish. The worker's `webhooks` queue runs `dispatch` every 2 s (claims
due deliveries with `FOR UPDATE SKIP LOCKED` under a lease and queues one `deliver` job each),
`deliver` (signs with `Crossmart-Signature`, POSTs through `HttpWebhookSender` with the SSRF
rules, stores the outcome and schedules the next attempt with backoff), and a daily `clean-up`
after 30 days. 30 failed attempts in a row turn an endpoint off and notify its managers. Signing
secrets are sealed with the workspace's data key. Public docs: [developers/webhooks.md](developers/webhooks.md).

## 6. AI layer

See [ADR 0016](decisions/0016-ai-layer.md).

- **Provider.** `AiProvider` (`libs/core/src/ai/providers`) is the one seam to a model. The Anthropic implementation
  uses `@anthropic-ai/sdk` with `AI_MODEL` (default `claude-sonnet-5-5`) and `ANTHROPIC_API_KEY`. Without the key
  the app boots, `GET …/ai/status` reports `configured: false`, and AI endpoints answer `503 AI is not configured`.
  OpenAI, Gemini, Ollama and per-workspace BYOK keys are later adapters behind the same interface.
- **Gateway.** Agents call the model only through `AiGateway.generate(context, request)`. It first asserts the
  plan has an AI credit left (`EntitlementService`, `Feature.AiCredits`; HTTP 402 `plan_limit_reached` while
  `ENTITLEMENTS_ENFORCED` is on), so no provider call is made past the limit. It meters the call, then
  validates the answer against the request's zod schema (also sent as the structured-output format). A refused,
  truncated, non-JSON or off-schema answer throws `AiOutputRejectedError` and nothing from it is stored. Prompts and
  answers are never logged; rejections log only which fields failed.
- **Metering.** Every call writes an `ai_usage` row: workspace, `AiFeature`, provider, model, input and output tokens.
  Rejected answers are metered too. `AiUsageService.report(workspaceId, period?)` sums calls and tokens per feature and
  model (`GET …/ai/usage`, the current UTC month by default). Plans read the same rows to meter `ai_credits`.
- **Rate limits.** The AI routes (`content-drafts`: 30, `content-generations`: 10 requests a minute) are limited per
  workspace and caller (person or API key) with `@nestjs/throttler`, opt-in per route through
  `WorkspacePrincipalThrottlerGuard`. The windows live in Redis (`RedisThrottlerStorage`), so every API instance
  shares them. Past the limit the API answers 429 with `Retry-After`. Content generations also check, before
  queueing, that the credits cover one call per product.
- **Prompts** are versioned files in `libs/core/src/ai/prompts` (`content-generator.v1.prompt.ts`), never inline
  strings. Product data goes in a fenced data block and the model is told to ignore instructions inside it.
- **Suggestions** (`libs/core/src/suggestions`). A `Suggestion` targets a product and optionally a connection, has a
  `SuggestionKind` (`listing_title`, `listing_description`), the value it replaces as it was when made, the proposed
  value, a rationale, its creator (`AGENT` with the `SuggestionAgent`, `USER` or `API_KEY`) and the requester, and a
  status: `PENDING`, `APPLIED`, `REJECTED` or `STALE`. Approving re-reads what the listing shows; if that changed, the
  suggestion becomes `STALE` and nothing is applied. Otherwise `SuggestionApplier` writes it through
  `ListingOverridesService.saveContent`, which merges the field into the listing's overrides and queues a sync, exactly
  like an edit. The review is claimed with a conditional update before applying, so concurrent approvals apply once. A
  newer proposal for the same product, connection and kind marks the older pending one `STALE`.
- **Content Generator** (`libs/core/src/content-generation`). `POST …/ai/content-generations` (up to 100 products for
  one store) validates the store and products, queues one job per product on the `ai` queue in one `addBulk`
  (deduplicated per product and store while waiting), and logs the request. The worker's `ContentGenerationRunner`
  reads the product and what its listing shows, asks for a title and description within the channel's rules
  (`ChannelContentRulesResolver`: core's writing guidance per channel in `CHANNEL_CONTENT_GUIDANCE`, and the limits
  the connector declares in `contentLimits`, such as eBay titles ≤ 80 characters and basic HTML without links, and
  Shopify titles ≤ 255 in rich HTML; descriptions aim for the channel's target length), strips markup the channel does not take, and stores the changed fields as pending suggestions. Unusable
  answers and a missing key are final; outages are retried and logged after the last attempt.
- **Credentials:** a platform key in the cloud today; BYOK per workspace later (encrypted like channel credentials).

## 7. API & clients

- REST, versioned at `/api/v1`, with OpenAPI generated from `@nestjs/swagger` decorators.
- `openapi.json` is published per release, and `crossmart-web` generates its typed client from it. The web CI fails on breaking changes.
- Auth uses Better Auth sessions (web) or workspace API keys (API/MCP). Rate limited per key.
- Errors use NestJS's JSON shape, `application/json` (not RFC 9457 problem+json):
  `{ "statusCode": 404, "error": "Not Found", "message": "Product not found" }`. On a validation
  failure (400), `message` is a list with one entry per problem. Plan refusals (402) add a typed
  `code` (`plan_limit_reached` or `plan_feature_not_included`) with the `feature`, `plan`, `limit`,
  `usage` and `requested` counts. See [developers/](developers/README.md#errors) for the public description.
- `sdks/typescript` is the official TypeScript SDK (`@crossmart/sdk`). Its types are generated from `openapi.json`
  and CI fails when they drift from the API. The public, developer-facing documentation lives in
  [developers/](developers/README.md).

## Media storage

Product images are uploaded with `POST /api/v1/workspaces/:workspaceId/media/product-images`. `MediaService` reads
the format from the bytes (JPEG, PNG, WebP or GIF; never SVG), names the file itself
(`workspaces/<workspaceId>/products/<uuid>.<ext>`) and stores it through `FileStorage` (`libs/common/src/storage`).
The only driver today is `local`: files on the API's disk (`STORAGE_LOCAL_DIR`, a volume in the cloud), served at
`MEDIA_PUBLIC_URL`. Products reference images by URL in `product_media`; images imported from channels keep their
external URLs and are never stored or deleted by Crossmart.

**Uploads table.** Every stored file has a row in `uploads`: workspace, storage key, URL, byte size, content type,
`created_at` and a nullable `orphaned_at`. A row is written right after the file; if the write fails the file is
deleted, so no file escapes tracking. There is deliberately no foreign key to `workspaces`: when a workspace is
deleted its rows remain, become orphans, and the cleanup deletes the files.

**Quota.** A workspace stores at most `WORKSPACE_STORAGE_MAX_BYTES` (5 GB), a guard against filling the disk, not a
plan limit. Usage is `SUM(byte_size)` over the workspace's `uploads` rows (indexed by `(workspace_id, url)`), never
a storage listing. Orphans count until they are deleted. An upload past the cap gets `413`.

**Orphan cleanup.** An upload is orphaned when no `product_media` row of its own workspace has its URL. Removing an
image from a product or deleting the product only makes it an orphan; nothing is deleted synchronously.

1. The scheduled `clean-up-uploads` job (BullMQ `storage` queue, every hour, one job scheduler for all instances)
   finds up to `UPLOAD_CLEANUP_WORKSPACES_PER_RUN` workspaces with work to do, and for each, in batches of
   `UPLOAD_CLEANUP_BATCH_SIZE`:
   - clears `orphaned_at` on uploads a product uses again;
   - sets `orphaned_at = now` on uploads no product uses;
   - deletes uploads orphaned for longer than `UPLOAD_ORPHAN_GRACE_MS` (7 days). The row is deleted only if it is
     still an orphan and still unused at that moment, then the file, in one transaction: if the file cannot be
     deleted the row stays and the next run retries. A file that is already gone counts as deleted.
2. The grace period protects an image uploaded now and attached later, edits in flight, and a removal undone
   within the week. Attaching an image clears its mark at once: the `product_media_reclaims_uploads` trigger runs
   on every insert into `product_media`, whatever wrote it (an edit, a bulk change, an import), so the grace period
   restarts the next time it is detached.
3. The job logs counts only (reclaimed, orphaned, deleted, failed), never keys or URLs.

The job runs in the **API**, not the worker, because the local driver's files are on the API's disk
(`MediaMaintenanceModule`). When an object storage driver (S3, R2) is added, it can move to the worker.

**Backfill.** Files stored before `uploads` existed are not counted or cleaned up until they are recorded. The
backfill lists the storage under `workspaces/`, records each product image it does not know yet, and skips other
files. A file a product uses is recorded under the URL the product uses (so a changed `MEDIA_PUBLIC_URL` never makes
a used file look orphaned). It is idempotent and never deletes anything, but files no product uses become orphans
and are deleted 7 days later, as intended. Run it once after the deploy that adds the `uploads` table, in the API
service, since it needs the storage volume:

```bash
# Railway: open a shell in the production api service (railway ssh --service api), then
node dist/apps/api/main.js --backfill-uploads
# Self-hosted Docker Compose
docker compose --profile app exec api node dist/apps/api/main.js --backfill-uploads
```

It logs `Recorded N files; M were already recorded, K skipped` and exits. Running it again records nothing new.

## 8. Security

- Tenant isolation: workspace guard + RLS.
- Secrets: envelope encryption, no secrets in logs, and redacting logger serializers.
- Webhook signature verification for every channel.
- Least-privilege OAuth scopes. Buyer PII is minimised and purged on a schedule (an Amazon requirement).
- Audit log for every write by users, agents and the API.
- Dependency scanning (Dependabot), CodeQL, `SECURITY.md` with a disclosure policy.

## 9. Deployment

- **Self-host:** `docker compose up` brings up api, worker, web, postgres and redis. Configuration is via env, telemetry is opt-out. PostgreSQL and Redis require `POSTGRES_PASSWORD` and `REDIS_PASSWORD` (Redis runs with `--requirepass`) and publish their ports on 127.0.0.1 only.
- **Cloud:** Railway (US East), using the same Docker images, with `staging` and `production` environments, a static egress IP, managed Postgres with PITR plus a daily off-site dump to S3/R2.
- **CI (GitHub Actions):** pull request checks only (format, lint, typecheck, unit and e2e tests, build, SDK checks), with no secrets. Nothing is published or deployed from Actions: maintainers release the SDKs and deploy from their own machines.

## 10. Telemetry (self-hosted)

A daily anonymous ping containing a random instance id, the version, connector counts by type and a listing-count bucket. It never includes product, order, customer or credential data. Disable it with `CROSSMART_TELEMETRY=false`. Telemetry is not implemented yet; the exact payload will be documented on a public page when it ships (ADR 0012).
