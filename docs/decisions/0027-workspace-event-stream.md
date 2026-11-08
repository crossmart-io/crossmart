# ADR 0027: Crossmart Agent and the workspace event stream

- Status: Accepted
- Date: 2026-11-08
- Builds on: Agent Worker ([ADR 0026](0026-agent-worker.md)), the activity log, outgoing webhooks
  ([ADR 0023](0023-outgoing-webhooks.md)) and inventory reconciliation ([ADR 0007](0007-overselling.md)).

## Context

Agent Worker opened as a side panel. Sellers could not see what it was doing to their stores while
it worked: a read, a proposal, an approved change syncing to Shopify. The web app is moving it to
a full page, **Crossmart Agent**: the chat, a live map of the catalog and its stores, and a stream
of everything that happens in the workspace (the agent's steps, other agents over MCP or API keys,
listings published or refused, stock reconciliation, orders, failed webhooks), like a monitoring
console. The page needs one feed of those events that updates live.

## Decision

### 1. The name

"Agent Worker" becomes **Crossmart Agent** wherever a person reads it: the app, the docs, the
system prompt, the messages the API returns, and the activity log's `actor.agentName`. Internal
names stay for compatibility: the module, the routes under `…/agent-worker/conversations`, the
permission `agent_worker:use`, the AI feature, the prompt id `agent-worker/v1` and the OpenAPI
tag. New activity events name the actor "Crossmart Agent"; older events stored "Agent Worker",
which the API now reads as "Crossmart Agent", and a background job carrying the old name still
resolves to the built-in agent.

### 2. A read model over the tables that already record what happens

There is no new event table. `WorkspaceEventFeed` (`libs/core/src/workspace-events`) merges
sources, each a class that reads one table and maps rows to `WorkspaceEvent`s:

| Source                      | Table                                        | Event types                                                                                                                                                                                                                                                                                                                                                 | Needs                                                       |
| --------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ActivityEventSource`       | `activity_events`                            | `listing.published`, `listing.updated`, `listing.failed` (with the store's reason), `listing.delisted`, `stock.reconciled`, `stock.sync_failed`, `stock.oversold`, `store.connected`, `store.disconnected`, `store.connect_failed`, `webhook.endpoint_disabled`, `agent.activity` (agents over MCP and API keys, named), `workspace.change` (anything else) | `activity:view`                                             |
| `AgentWorkerEventSource`    | `agent_worker_actions`, `agent_worker_turns` | `agent.tool_called`, `agent.change_proposed`, `agent.change_approved`, `agent.change_rejected`, `agent.change_applied`, `agent.change_failed`, `agent.turn_failed`                                                                                                                                                                                          | `agent_worker:use`, and only the reader's own conversations |
| `OrderEventSource`          | `orders`                                     | `order.received`                                                                                                                                                                                                                                                                                                                                            | `orders:view`                                               |
| `WebhookFailureEventSource` | `webhook_deliveries`                         | `webhook.delivery_failed` (the endpoint's host only)                                                                                                                                                                                                                                                                                                        | `webhooks:manage`                                           |

Each event has a stable id (`<source>:<row id>[:<step>]`), a type, a category (`agent`, `stores`,
`orders`, `workspace`) and a severity (`info`, `success`, `warning`, `error`) for filtering, a
summary and detail safe to show, the actor, and references (`connectionId`, `productId`,
`orderId`, `webhookEndpointId`, `conversationId`, `actionId`) so a client can point at the store or
product on its map. Crossmart Agent's changes for the reader are left out of the activity source:
their own conversation already shows each step.

Additive changes the sources need (migration `20261120100000_workspace_event_stream`):

- `activity_events.connection_id` (nullable, no foreign key, so history outlives the store): the
  store a listing or stock event happened on. Sync outcomes record it; events about a store
  (subject `channel_connection`) fill it from the subject.
- `agent_worker_actions.finished_at`: when a read answered or an approved change was made or
  refused (`executed_at` stays "made").
- Indexes `orders (workspace_id, created_at)` and `webhook_deliveries (workspace_id, status,
updated_at)`.
- Two activity actions: `stock_reconciled` (reconciliation corrected what a store showed; counted,
  logged only when something was wrong) and `stock_sync_failed` (a store refused stock levels;
  logged once, not again while the listing shows the same reason).

### 3. Cursors, and nothing skipped

Events are ordered by time, then id. A cursor is that position (opaque base64url JSON). A page
holds back the newest `WORKSPACE_EVENT_SETTLE_MS` (1.5 seconds), so a transaction that commits a
moment after its timestamp is still read in order and never jumps behind a cursor. Each source
reads the window with its time index and the tie-break on id; an idle cursor moves to the end of
the window, so polling does not re-read the same range. A cursor the API did not give out is a 400.

### 4. The API

Both under `/api/v1/workspaces/{workspaceId}/events`, `activity:view`, any principal (session, API
key, agent), allowed while read-only, rate-limited per workspace and caller:

- `GET …/events?after=<cursor>&limit=` (120 per minute): a page, oldest first, with the next
  cursor. Without `after`, the latest events of the past 7 days. This is the polling fallback.
- `GET …/events/stream` (30 per minute): server-sent events. Without a cursor it starts with the
  latest events; with `Last-Event-ID` (or `after`) it resumes after that event. Every
  `workspace_event` carries its cursor as the SSE id; `ready` (its id is the cursor) says the
  backlog is out. It sends `retry: 3000`, a comment every 15 seconds, polls the feed every
  2 seconds (at once again while pages come back full), and ends after 10 minutes so the client
  reconnects and its access is checked again; at shutdown every stream ends.

`AgentWorkerActionDto` gains `targets` (`connectionIds`, `productIds`), read from the tool's
input, so the chat's live turn can light up the stores and products the agent works on before
anything is stored.

## Consequences

- No producer writes to the stream: a new kind of event is a new source class, and the activity
  log stays the record of changes. The trade-off is latency (the settle time plus the poll
  interval, about 2 to 4 seconds) and a few indexed queries per open stream every 2 seconds. The
  chat's own turn stream is still instant; the page uses it for the map.
- Readers see only what their role allows, per source, and only their own agent conversations.
- Not in this version: pushing through Redis between instances instead of polling, server-side
  filters, and events older than 7 days in the stream (the activity log has them).
