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
wording in `activity-summary.ts`; actions are stored as text, so this needs no migration.

## 3. Core domain model (initial)

```
Organization ─┬─ Subscription (plan, status, provider ids)
              └─ Workspace ─┬─ Member (user, role)
                            ├─ ApiKey
                            ├─ ChannelConnection (channel, credentials[encrypted], status, settings)
                            ├─ Product ─┬─ Variant (sku, gtin, attributes JSONB)
                            │           │    └─ InventoryItem ── InventoryMovement (ledger)
                            │           ├─ ProductContent (base: title, description, bullets, attributes)
                            │           ├─ Media
                            │           └─ Listing (per channel) ─┬─ ChannelContent (overrides)
                            │                                     ├─ external id, status, errors
                            │                                     └─ last sync state
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
- Stock on hand is derived from the ledger (`InventoryMovement`). Each `InventoryItem` stores `available` (what can be sold, and what channels receive) and `reserved` (held for open orders); on hand = available + reserved. Both columns are updated atomically with the ledger, and every movement records the stock on hand after it, its reason and its author. The author is the same `Actor` the activity log credits (a user or an API key), and manual adjustments also appear as `inventory_adjusted` events in the product's activity. Every stock change goes through the inventory module: manual adjustments, product edits and inventory file imports (`StockLevelsService`, reason `IMPORTED`) all write the same ledger.

## 4. Connector SDK

Each connector implements a set of capability interfaces, so the orchestrator only calls what a channel supports:

```ts
interface ChannelConnector {
  readonly channel: ChannelType;
  readonly capabilities: ReadonlySet<ChannelCapability>;
  readonly auth: ChannelAuthStrategy;          // OAuth app | seller-provided credentials
}
interface ListingPublisher   { publish(...); update(...); delist(...); }
interface InventoryUpdater   { setQuantities(batch: InventoryUpdate[]): Promise<...>; }
interface OrderSource        { fetchOrders(since): ...; parseWebhook(payload): ...; }
interface FulfillmentSink    { pushTracking(...): ...; }
interface CatalogImporter    { importProducts(cursor): ...; }
interface TaxonomyProvider   { searchCategories(...); requiredAttributes(categoryId); }
```

- **Rate limiting:** each connector declares its rate-limit buckets, and the worker uses per-connection BullMQ limiters.
- **Priority queues:** `inventory` > `orders` > `price` > `content` > `import`.
- **Credentials:** encrypted with envelope encryption (a data key per workspace, wrapped by a master key from env/KMS). They are never logged and never returned by the API.
- **Feed channels:** a generic template-based feed exporter (XML/CSV/TSV), so most simple channels are configuration only.
- A **test kit** of recorded fixtures and contract tests is required for every connector PR.

## 5. Sync & inventory flows

**Order → inventory (overselling protection)**

1. A webhook or poller receives an order and upserts it by `(channel, external_order_id)` (idempotent).
2. In one transaction, `InventoryMovement(-qty, reason=ORDER)` is written and `available` is decremented with a conditional update.
3. Fan-out jobs are enqueued on the `inventory` priority queue for every other listing of that variant.
4. The inventory policy (buffer, low-stock lock to the primary channel, allocation) computes the quantity per channel.
5. If `available < 0`, an `OversellIncident` and a resolution `Suggestion` are created.

**Reconciliation:** inventory every 15 minutes and everything else daily. The job compares each channel's state to Crossmart and corrects drift, logging what it changed.

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
