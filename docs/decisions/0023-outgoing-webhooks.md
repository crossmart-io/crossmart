# ADR 0023: Outgoing webhooks, from a transactional outbox

- Status: Accepted
- Date: 2026-11-06

## Context

Integrations learn about changes by polling. The n8n trigger pages orders, stock and listings on
an interval and dedupes in its own state (`docs/developers/n8n.md`), and Zapier, Make and agents'
backends would have to do the same. Polling is late, costs requests on both sides, and misses
changes that fall between its filters (an order a store reports late, a listing that fails twice
with the same error).

Crossmart already knows when things change: order ingestion, the inventory ledger (the only
writer of stock), catalog writes and the listing sync. It has an in-process `CatalogEventBus`,
but its listeners run after the commit and may fail, so it cannot promise delivery. Events must
not be lost when a process dies after a write, nor sent for a write that rolled back.

## Decision

**1. Endpoints.** A workspace registers endpoints (`/api/v1/workspaces/{id}/webhook-endpoints`):
a URL, an optional description and the event types it subscribes to. Each has its own signing
secret. Managing them needs the new `webhooks:manage` permission (Owner and Admin), since events
carry workspace data to the URL.

**2. Event catalog.** `WebhookEventType`, a string enum stored as text:

| Type                      | When                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| `order.created`           | A channel order is stored for the first time                         |
| `order.updated`           | A newer copy of an order arrives (the same copy twice is not one)    |
| `inventory.stock_changed` | A ledger write moves stock, for any reason; one event per write      |
| `listing.published`       | A product goes live on a store for the first time                    |
| `listing.failed`          | A store refuses a listing for good (it is in `ERROR`)                |
| `listing.removed`         | A listing is taken off its store                                     |
| `product.created`         | A product is created (by hand, API, file or channel import)          |
| `product.updated`         | A product is edited, alone or in bulk                                |
| `product.deleted`         | A product is deleted                                                 |
| `webhook.test`            | Only from "send test event", to one endpoint, whatever it subscribes |

New types are additive. A product deleted from Crossmart sends `product.deleted`, not one
`listing.removed` per store.

**3. Payload.** Every delivery is a `POST` with a JSON envelope:
`{ id, type, createdAt, workspaceId, apiVersion: "v1", data }`. `data` is a snapshot of what the
event is about, read inside the transaction that changed it (types in
`libs/core/src/webhooks/entities/webhook-event-data.ts`). Money is a decimal string and times are
ISO 8601, as in the REST API. Fields may be added within `v1`, never removed or renamed.

**4. Transactional outbox.** The service that changes something calls `WebhookOutbox.publish`
inside its own transaction. It finds the workspace's enabled endpoints subscribed to the type (one
indexed query), and only then builds the data and inserts the event and one delivery per endpoint.
They commit or roll back with the change. Workspaces without endpoints pay one cheap query per
write and store nothing. Writes that were not transactions before (product create, bulk edits,
deletes, delisting, listing failures) now are. The outbox has its own module
(`WebhookOutboxModule`), so domain modules publish without depending on delivery.

**5. Delivery, at least once.** The worker's `webhooks` queue (its own, so endpoints never slow a
sync) runs:

- `dispatch`, a job scheduler every `WEBHOOK_DISPATCH_INTERVAL_MS` (2 s), plus right after a test
  or redelivery. It claims due deliveries in batches of 100 with `FOR UPDATE SKIP LOCKED` and a
  lease of 2 minutes, and queues one `deliver` job each, deduplicated per delivery and attempt.
  Any number of workers can dispatch. A worker that dies mid-delivery loses the lease, and the
  delivery is claimed again.
- `deliver` (concurrency 20 per worker) signs and sends one attempt and stores its outcome. A late
  job for an attempt already made changes nothing.

Receivers deduplicate on the event `id`, which stays the same across retries and redeliveries.

**6. Retries.** Only a 2xx answer succeeds. Redirects are failures and are never followed.
Attempt _n_ waits 30 s × 2^(n-1), capped at 6 hours, plus up to 10% jitter. Twelve attempts in
all, about 16 hours. A test event is tried once. The outcome of each attempt (status, duration, a
safe error, the next attempt) is stored on the delivery, not in BullMQ, so the merchant sees it.

**7. Auto-disable.** Each failed attempt adds to the endpoint's `consecutiveFailures`, and a
success resets it. At 30 in a row the endpoint is turned off (`disabledReason: FAILING`), its
pending deliveries fail, the activity log records it (as the system), and every member who may
manage webhooks gets an email. Turning it back on clears the count. Events from while it was off
are not sent. They can be redelivered from the log while it is kept.

**8. Signing.** `Crossmart-Signature: t=<unix seconds>,v1=<hex>`: HMAC-SHA256 keyed with the
whole secret (`whsec_` plus 32 random bytes, base64url), over `<t>.<raw body>`. This is the
Stripe scheme, which receivers and their libraries know. Receivers should refuse a timestamp more
than 300 seconds off (`WEBHOOK_SIGNATURE_TOLERANCE_SECONDS`) and compare in constant time. Each
attempt is signed with its own timestamp. The SDKs ship `verifyWebhookSignature` (TypeScript),
`verify_webhook_signature` (Python) and `WebhookSignature::verify` (PHP). Other headers:
`Crossmart-Event-Id`, `Crossmart-Event-Type`, `Crossmart-Delivery-Id`.

**9. Secrets.** Secrets are sealed with the workspace's data key, like channel credentials
(envelope encryption, bound to the endpoint). They are shown once, on creation and on rotation,
and never logged. Rotating keeps the old secret for 24 hours: deliveries carry two `v1`
signatures, so the receiver can switch without dropping events. Rotating again within that window
ends the older secret's grace at once. Without `CREDENTIALS_MASTER_KEY`, creating an endpoint
answers 503.

**10. SSRF.** An endpoint must not make Crossmart call its own network:

- https only in production; plain http only outside it.
- No user name or password in the URL.
- Every address the host resolves to must be public (the blocked ranges of `isPublicAddress`, now
  in `libs/common/src/net`, shared with the image fetcher). This is checked when the URL is saved,
  and again as each delivery's socket connects (`guardedLookup`), so DNS rebinding cannot slip
  past.
- No redirects, a 10-second deadline for the whole exchange, and at most 64 KB of the response
  read and then dropped. Response bodies are never stored.

A self-hosted instance on a trusted network can set `WEBHOOK_ALLOW_PRIVATE_URLS=true` to reach,
say, an n8n on the same network. It must never be set where untrusted users add endpoints.

**11. Plan limit.** ADR 0020 includes the API in every plan, so webhooks are not a plan feature.
Endpoints are still counted, to guard against abuse: `Feature.WebhookEndpoints`, across the
organization, enabled or not, through `EntitlementService` like API keys. Migration
`20261114100000_outgoing_webhooks` gives every plan version twice its API key limit (unlimited
where keys are), without naming plans: Starter 10, Pro 20, Growth 50, Scale 200, Enterprise
unlimited. The limit blocks only while `ENTITLEMENTS_ENFORCED` is on.

**12. Retention.** A daily job deletes events older than 30 days (`WEBHOOK_RETENTION_DAYS`), with
their deliveries, in batches, keeping an event whose delivery is still under way.

**13. Agents.** A new scope, `webhooks:write`, unlocks `webhooks:manage` for an agent (ADR 0019)
and two MCP tools: `list_webhook_endpoints` and `create_webhook_endpoint`. An agent can so point
its own backend at events. Changing, turning off and deleting stay with people and the REST API.

## Consequences

- Integrations get events within seconds instead of polling. The n8n trigger registers an endpoint
  when a workflow is activated and deletes it when deactivated, with polling kept as a separate
  node for instances Crossmart cannot reach.
- Every write that publishes runs in a transaction and does one more indexed query. Product
  imports create a batch in one interactive transaction (with a 30-second timeout) instead of a
  batched one.
- The outbox tables grow with traffic for 30 days. The `(status, next_attempt_at)` index keeps
  dispatch cheap, and retention deletes in batches.
- Delivery is at least once and unordered across events. Receivers must deduplicate on `id` and
  read `createdAt` (or fetch the resource) when order matters.
- Not in this version: per-store filters, payload versions beyond `v1`, events for settings,
  members or suggestions, and a replay of events missed while an endpoint was off.
