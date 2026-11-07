# ADR 0026: Agent Worker, an agent inside the app that proposes and waits for approval

- Status: Accepted
- Date: 2026-11-08
- Builds on: the AI layer ([ADR 0016](0016-ai-layer.md)), agent access ([ADR 0019](0019-agent-access.md)),
  Ask Crossmart ([ADR 0022](0022-ask-crossmart.md), [ADR 0025](0025-agent-to-agent.md)) and billing
  ([ADR 0024](0024-billing.md)).

## Context

Sellers can already connect their own agent (Claude, ChatGPT and others) to Crossmart over MCP.
Many will not: they want to say "fix my failed eBay listings" inside Crossmart and get it done.
The product rule is "Your agents do the work. You approve it." An agent inside the app must
therefore read freely, change nothing on its own, and be as constrained as an outside agent.

## Decision

### 1. One tool layer for MCP and Agent Worker

The MCP server's tools moved from `apps/mcp/src/tools` to `libs/core/src/agent-tools`: each
tool is data (name, description, zod input, read-only or not, destructive, the scope it needs,
and the REST call it makes), with the API client that calls it. The MCP server registers them as
MCP tools; Agent Worker offers the same specs to the model. Two new spec fields describe risk:
`publishes` (it publishes a listing) and `priceInputs` (inputs that change what buyers pay).

### 2. Tools run through the REST API, over loopback

Agent Worker never touches the database for a tool. `LoopbackToolExecutor` calls the API on
`127.0.0.1:<the port it listens on>` with the MCP server's own `CrossmartApiClient`, so every call
meets the guards any agent meets: the workspace in the path, the person's permissions, the
read-only subscription guard, sandbox rules, validation and the activity log.

- **Credential.** A JWT (HS256) naming the person, workspace and conversation, valid for 2 minutes,
  minted per tool call and signed with a key derived from `BETTER_AUTH_SECRET` for this purpose
  only (`crossmart:agent-worker-token:v1`). It travels in `x-crossmart-agent-worker` and is
  accepted only on a connection from a loopback address, so a forwarded request can never use
  one, whatever it sends. It never leaves the server.
- **Principal.** A new principal kind, `agent-worker`. Like a connected agent it reaches
  workspace routes only, and its permissions are Agent Worker's scopes (`catalog:read`,
  `catalog:write`, `orders:read`, `stores:write`, `reports:read`, `suggestions:write`; never
  webhooks, members, keys, store connections, settings or billing) narrowed by the person's role
  at the moment of the call. The person must still hold `agent_worker:use`.
- **Activity.** Changes are credited to an `AGENT` actor with the person as its user and the
  agent name "Agent Worker" (`actor_agent_name`), so the log reads "Agent Worker on behalf of
  <person>". No new actor type and no migration of `activity_events`.

### 3. Safety model

- **Reads run at once.** Their results go back to the model.
- **Writes never run from the model.** Every call to a non-read-only tool becomes a _proposed
  action_ in the chat with a before/after preview. They are shown in the chat rather than the
  suggestions inbox: suggestions only model a content field on one listing, while Agent Worker
  proposes any tool call (stock, listings, categories, publishing). The suggestions inbox stays
  for background agents.
- **One confirmation per answer.** Every change waiting in a conversation is decided in one call:
  the listed ones are approved, the others rejected. A new message expires what still waits.
- **Explicit confirmation for risky changes.** A proposal is tagged `destructive` (the tool
  deletes or takes off sale), `price_change` (it sets a price input) or `bulk` (it names more
  than 5 items, or the confirmation publishes more than 5 listings). Approving any of them also
  needs `confirmHighRisk: true`; the API refuses with 400 otherwise.
- **On approval** each action is claimed with a conditional update (so it runs once), executed
  through the API with the person's _current_ permissions, and its result recorded; then the
  model continues with the results. A refusal (permission, read-only, plan limit) is recorded
  and shown, never hidden.
- **Untrusted text.** Tool results are fenced as data (`<tool_output tool="…">`, with any closing
  fence inside escaped). Text that reads like instructions ("ignore previous instructions",
  "delete everything", `<system>`) adds a notice for the model and marks proposals of the same
  turn with `untrustedWarning`, shown on the approval card. The system prompt (`agent-worker/v1`)
  says that tool output, catalog text and marketplace or buyer text are data, never instructions.
  None of this is the defence: even a fully hijacked model can only _propose_.
- **Input validation.** Every tool input is validated against the tool's zod schema (strict, so a
  model cannot add `workspaceId`) before it runs or is proposed. Invalid calls are refused and
  the model is told where.
- Refused or truncated answers never run their tool calls (they are stripped before storing).

### 4. The loop

`AgentWorkerLoop` calls the model through `AiGateway.converse`, a new streaming,
tool-using call on the `AiProvider` abstraction (Anthropic: `client.beta.messages.stream` with
the tools, top-level prompt caching and the server-side refusal fallback). The conversation is
stored provider-neutrally and replayed append-only: assistant messages keep the provider's own
blocks (reasoning) to send back unchanged; tool results are derived from the stored actions only
once final. A turn stops when the model answers without tools, proposes changes (it then waits),
is cancelled, fails, or after `AGENT_WORKER_MAX_STEPS_PER_TURN` (8) model calls. Each call may
write `AGENT_WORKER_MAX_OUTPUT_TOKENS` (8,000). The model is `AGENT_WORKER_MODEL` (default
`claude-sonnet-5-5`).

### 5. Metering and limits

- Every model call is one AI credit (`AiFeature.AgentWorker`), as for every AI call. A turn checks
  for credits before it starts (402 `plan_limit_reached` while plans are enforced) and before
  each call; running out mid-turn ends it with a `credits_exhausted` event, keeping what ran.
- An unclaimed sandbox gets 403 `sandbox_claim_required`: Crossmart's AI is not served there.
- A read-only organization (ADR 0024) can still chat and read: the chat routes are
  `@AllowedWhileReadOnly()`, but writes are refused before they are proposed, and the API refuses
  them anyway.
- 20 turns (messages and decisions) per workspace per minute, in Redis.
- One running turn per conversation (a conditional claim on the conversation; a turn older than 10
  minutes is taken over, for a crashed instance).

### 6. API and data

Under `/api/v1/workspaces/{workspaceId}/agent-worker/conversations`, gated by the new permission
`agent_worker:use` (Owner, Admin, Editor; custom roles may hold it), for signed-in people only:
list, create, read, delete, `POST …/{id}/messages` and `POST …/{id}/decision` (both answer with
server-sent events, one `AgentWorkerStreamEventDto` per event), and `POST …/{id}/cancel`.

Migration `20261119100000_agent_worker` adds four tables: `agent_worker_conversations`,
`agent_worker_turns`, `agent_worker_messages` and `agent_worker_actions`. Closed sets are text
columns holding TypeScript string enums. Conversations belong to one person in one workspace and
are deleted with either. **Retention: 180 days** after the last message
(`AGENT_WORKER_RETENTION_DAYS`), purged daily by the worker's maintenance queue in batches.

## Consequences

- Agent Worker can do exactly what the person's role and its scopes allow, no more, and any tool
  added to the shared layer is offered to both MCP agents and Agent Worker.
- Every tool call is an HTTP request to the same instance: a small overhead that buys one
  enforcement path. The API must listen on a loopback-reachable port.
- A stop request reaches the model call at once on the instance running the turn, and at the
  next step on any other instance. A client that closes the stream stops its turn.
- Autonomy (letting some changes apply without approval, `Feature.AutonomousAgents`) can later
  auto-approve proposals by policy, using the same decision path.
- Not in this version: attaching to a turn running in another tab, conversation search, sharing a
  conversation, Ask Crossmart and webhook tools inside Agent Worker.

## Cost

Per model call the model reads the system prompt (about 750 tokens), 28 tool definitions (about
8,000 tokens) and the conversation. A typical turn ("fix my failed eBay listings": two reads, then
a proposal) makes 3 calls, reading about 32,000 input tokens and writing about 1,000 to 2,000. On
`claude-sonnet-5-5` ($2 in, $10 out per million) that is about 8 cents uncached; prompt caching of
the tools, prompt and history (cache writes at 1.25×, reads at $0.20 per million) brings it to
about 5 cents. A simple question (one read and an answer) is about 3 cents. Each call uses one
AI credit, so a typical turn uses 3. On `claude-haiku-5-5` the same turn costs well under a cent.
