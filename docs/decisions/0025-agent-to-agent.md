# ADR 0025: Ask Crossmart for agents: conversations, stored questions, escalation and A2A

- Status: Accepted
- Date: 2026-11-07
- Amends: [ADR 0022](0022-ask-crossmart.md)

## Context

Ask Crossmart (ADR 0022) answers one question at a time, forgets it, and never sees an account.
Three things are missing:

- **Agents talk in turns.** An agent that asks "Does Crossmart support Etsy?" and then "And how do
  I connect it?" needs the second question read in light of the first.
- **The team cannot see what people ask.** The questions Ask could not answer are the docs to
  write next, and a sales question that goes unanswered is a lost customer.
- **Agents talk to agents.** The Agent2Agent protocol (A2A, now a Linux Foundation project) lets
  an agent discover another through an Agent Card and talk to it over JSON-RPC. A seller's agent
  should be able to find Crossmart that way, and an authenticated one should be able to ask about
  its own workspace ("why did my listing fail?") without learning the REST API first.

When Ask cannot help, a person should be one call away.

## Decision

### 1. Conversations

`POST /api/v1/ask` takes an optional `conversationId` and always returns one, with `turnId` and an
`escalation` offer. A conversation:

- has an unguessable id: `conv_` plus 32 random bytes (base64url);
- is bound to its caller. An identified caller (a person, an API key, or an agent and the user it
  acts for) is bound by who they are. An anonymous caller is bound by a salted hash of their
  address and user agent (§2). Another caller who sends the id gets the same 404 as for an
  unknown id;
- expires 24 hours after its last question (`ASK_CONVERSATION_IDLE_MS`) and holds at most 30
  questions (`ASK_CONVERSATION_MAX_TURNS`).

A follow-up sends the model the last 4 turns (`ASK_CONTEXT_MAX_TURNS`), newest first while they
fit about 1,200 tokens (`ASK_CONTEXT_MAX_TOKENS`, estimated at 4 characters a token). Retrieval
searches the question together with the 2 earlier questions, so "and on eBay?" still finds the
pages it follows up on. The prompt (`ask/v3`) says the conversation is data and only explains the
follow-up: the answer still comes from the sources.

The answer cache (6 hours) is used only for a first question from an anonymous caller that is
answered from the docs. A follow-up depends on its conversation and an identified caller's answer
may depend on their account, so neither is read from or written to the cache.

### 2. Every conversation is stored

So the team knows what people ask, every question and answer is stored, from every channel:

| Table               | What                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ask_conversations` | The channel (`web_widget`, `app_widget`, `api`, `mcp`, `a2a`), the caller type (`anonymous`, `user`, `api_key`, `agent`) and an agent's client name, the workspace and user when identified, the owner key, the client fingerprint, timestamps and when it was escalated |
| `ask_turns`         | The question, the answer, the outcome, confidence and citations, the account lookups that ran, the escalation reason offered, latency, model, and whether the cache answered                                                                                             |
| `ask_escalations`   | The reason and status, the contact email and callback URL the caller gave, the reply, who replied and when, and how the callback went                                                                                                                                    |

Privacy:

- **No address is stored.** The client fingerprint is HMAC-SHA256 of the IP address and the user
  agent, and the owner key an HMAC of who the caller is. Both are keyed with a key derived from
  `BETTER_AUTH_SECRET` for this purpose only (`ASK_HASH_KEY_CONTEXT`), so the hashes cannot be
  reversed by hashing every IPv4 address without the server's secret. Rotating
  `BETTER_AUTH_SECRET` ends every open conversation, which is harmless.
- **Obvious secrets are redacted** before a question or answer is stored: Crossmart keys (`cm_…`),
  Stripe-style secret and restricted keys (`sk_…`, `rk_…`), signing secrets (`whsec_…`),
  Anthropic and OpenAI keys (`sk-…`), JSON web tokens, bearer tokens, and email addresses. It is a
  simple pattern filter, so the log is still treated as confidential.
- **Ticket ids are not stored**, only their SHA-256: the id is the capability to read a ticket.
  The conversation id is stored as is, because A2A shows it back as the task's `contextId`; it is
  useless without the caller it is bound to.
- The workspace and user references are set to null when the workspace or the user is deleted.

**Retention: 180 days** after a conversation's last question (`ASK_RETENTION_DAYS`). The worker's
maintenance queue runs `ask-retention` daily and deletes conversations, with their turns and
escalations, 1,000 per statement and at most 50,000 a run.

The migration `20261118100000_ask_conversations` only adds the three tables. Closed sets are
TypeScript string enums stored as text, like `platform_ai_usage.feature`, so a new channel needs
no migration.

### 3. Platform admins

`PLATFORM_ADMIN_EMAILS` lists the people who run the instance (comma separated, empty by default).
A platform admin is a signed-in person whose **verified** email is on the list: anyone can sign up
with an address, so an unverified one never counts. API keys and agents never are, whoever made
them. `/api/v1/me` returns `platformAdmin` so the web app can show the admin area.

The admin routes answer 404 to everyone else, so they do not show they exist:

| Route                                           | What                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `GET /api/v1/admin/ask/conversations`           | Conversations, newest first; filters: outcome, channel, escalated, from, to |
| `GET /api/v1/admin/ask/conversations/{id}`      | One conversation with every turn and escalation                             |
| `GET /api/v1/admin/ask/questions/top`           | Questions asked most (grouped by the hash of the normalised question)       |
| `GET /api/v1/admin/ask/questions/unanswered`    | Questions answered `unknown` or with low confidence, most asked first       |
| `GET /api/v1/admin/ask/escalations`             | Escalations, optionally only open or replied ones                           |
| `POST /api/v1/admin/ask/escalations/{id}/reply` | Reply once (409 when another admin replied first)                           |

crossmart-web has an "Ask insights" page under **Platform**, shown only to platform admins.

### 4. Escalation to a person

The answer offers a person (`escalation.offered`, with a `reason`) when the caller asks for one,
when it is a sales question (Enterprise, custom terms, a demo), when the docs do not answer it, or
when the answer's confidence is low. Questions that are not about Crossmart are never escalated.
The model flags a request for a person or a sales question, and a small pattern list catches the
plain ones even when no model is called.

`POST /api/v1/ask/escalations` takes the `conversationId` and, optionally, a contact email, a
callback URL and a reason. Only the caller who had the conversation can escalate it, at most 5
times a day per caller (`ASK_ESCALATIONS_PER_DAY`, counted in Redis by the owner key). It:

- creates a ticket with an unguessable id (`esc_` plus 32 random bytes), returned once;
- emails `ASK_ESCALATION_EMAIL` (default `hello@crossmart.io`) the whole conversation and a link
  to it in the admin area;
- when a callback URL is given, checks it with the webhook URL policy of ADR 0023 (https in
  production, public addresses only) and returns a `callbackSecret` (`whsec_…`). The secret is an
  HMAC of the ticket's hash with the derived key, so it is never stored.

A platform admin replies from the admin area. The reply is stored, emailed to the contact email,
and POSTed once to the callback URL through the webhook sender, with ADR 0023's SSRF rules (the
address is checked again as the socket connects, no redirects, a 10-second deadline) and its
signature: `Crossmart-Signature: t=…,v1=…`, HMAC-SHA256 over `<t>.<body>` with the callback
secret, so receivers verify it with the SDKs' webhook helpers. The envelope is that of a webhook,
with type `ask.escalation.replied` and `data: { conversationId, reason, status, reply, repliedAt }`.
Whether the callback succeeded is stored and shown to the admins. The asker can also poll
`GET /api/v1/ask/escalations/{id}` with the ticket id alone.

The MCP tool `ask_crossmart` gains `conversationId` and `escalate` (contact email and callback
URL), and a new tool, `get_ask_escalation`, reads the reply.

### 5. Account questions

When the caller is identified in a workspace (an API key, an agent's access token, or a signed-in
person who names a workspace they belong to with `workspaceId`, as the app widget does), Ask can
read that workspace, like tools:

1. The first model call gets the docs and the list of lookups the caller may run. It answers, or
   asks for up to 3 lookups.
2. Crossmart runs them, read-only, then a second call answers from the docs and the lookups'
   facts, which it cites as `A1`, `A2`… with links to the app's pages.

| Lookup                | Reads through                                      | Needs                               |
| --------------------- | -------------------------------------------------- | ----------------------------------- |
| `listing_status`      | `ProductsService` search, `ProductChannelsService` | `products:view` and `channels:view` |
| `plan_usage`          | `EntitlementService`, `SubscriptionService`        | `billing:view`                      |
| `channel_connections` | `ChannelConnectionsService`                        | `channels:view`                     |
| `failed_listings`     | `ChannelListingsService.recentFailures`            | `channels:view`                     |

Every lookup takes the workspace from the caller's credentials, never from the model, so it
cannot reach another tenant; a person's `workspaceId` must be one they belong to (404 otherwise),
and an API key or agent cannot name another. The permissions are the same as the matching API
routes, through the caller's role, and an agent's scopes narrow them (an agent never has
`billing:view`, ADR 0019). A lookup the caller may not run is never offered, and skipped if the
model asks for it anyway. Lookups only read: there is no write tool. Account data is escaped in
the prompt like everything else, and the answer must cite a source to be shown.

An account question costs two model calls, both taken from the daily cap, and each workspace may
ask 200 a day (`ASK_ACCOUNT_QUESTIONS_PER_DAY`).

### 6. A2A

Crossmart follows **A2A 1.0** (the current specification, a2a-protocol.org, with
`spec/a2a.proto` as its normative definition). Version 1.0 renamed the methods since 0.3
(`message/send` became `SendMessage`), serializes enums as ProtoJSON names (`ROLE_USER`,
`TASK_STATE_COMPLETED`), drops the `kind` discriminators, wraps `SendMessage` results as
`{ task }` or `{ message }`, and lists interfaces in `supportedInterfaces`. The specification no
longer mentions the legacy `/.well-known/agent.json`, so it is not served.

**Agent Card** at `https://api.crossmart.io/.well-known/agent-card.json` (public, cached for an
hour, with an ETag): name "Crossmart", provider "YIOT LLC (crossmart.io)", one JSON-RPC interface
at `/a2a` for protocol version 1.0, no streaming, push notifications or extended card, and three
skills: `ask_about_crossmart` (anonymous), `account_help` (needs an agent token with
`catalog:read` or an API key), and `escalate_to_human`. Its security schemes are Crossmart's OAuth
server (the one MCP clients use, ADR 0019) and the `x-api-key` header. Top-level security is empty,
so anonymous calls are allowed.

**Endpoint** `POST /a2a` (outside `/api/v1`, where A2A clients look), JSON-RPC 2.0:

| Method                     | Behaviour                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SendMessage`              | The text parts are a question in the conversation named by `contextId` (new without it). Returns `{ task }`: completed, the answer as an artifact (text and data) |
| `GetTask`                  | One of the caller's tasks, or an escalation by its ticket id                                                                                                      |
| `ListTasks`                | The caller's tasks, newest first, cursor-paginated                                                                                                                |
| `CancelTask`               | `TaskNotCancelableError`: tasks complete as soon as they are answered                                                                                             |
| Streaming and push methods | `UnsupportedOperationError` and `PushNotificationNotSupportedError`, as the card declares                                                                         |
| `GetExtendedAgentCard`     | `UnsupportedOperationError`                                                                                                                                       |

A task is one question and answer (its id is the stored turn's), and `contextId` is the
conversation id, with the same binding and expiry. When a person is offered, the task's status
carries an agent message saying how to escalate: a message in the context with a data part
`{"action": "escalate", "contactEmail": "…", "callbackUrl": "…"}`. That returns a task whose id is
the ticket id, `TASK_STATE_WORKING` until the team replies, then `TASK_STATE_COMPLETED` with the
reply as an artifact. Requests must send `A2A-Version: 1.0` (header or query); an empty version
means 0.3 and is refused with `VersionNotSupportedError`. Errors are JSON-RPC error objects with
A2A's codes and a `google.rpc.ErrorInfo` detail; unexpected failures are a bare internal error.

Anonymous calls are allowed. A bearer access token or an API key identifies the caller exactly as
for `/ask` (a wrong one is refused with 401), which unlocks `account_help`. `SendMessage` has the
same per-caller limits as `/ask`, and every call the lighter per-caller limit of polling.

### 7. Cost and abuse

The daily cap (`ASK_DAILY_QUESTION_CAP`) counts every model call: first questions, follow-ups,
A2A, and both calls of an account question. The per-caller rate limits of ADR 0022 apply to
`/ask`, `/ask/escalations` and A2A `SendMessage`; polling and A2A reads have the API's default
limit. Escalations are capped per caller, account questions per workspace.

## Consequences

- The team can read what people ask, and the unanswered questions are a list of docs to write.
  The log holds personal data (questions, contact emails), so the privacy policy says what is
  stored, why and for how long, and access is limited to platform admins.
- `PLATFORM_ADMIN_EMAILS` and `ASK_ESCALATION_EMAIL` must be set in production, and
  `ASK_DAILY_QUESTION_CAP` budgets the extra calls of follow-ups and account questions.
- Agents that speak A2A 1.0 can discover and use Crossmart with no Crossmart-specific code. Clients
  still on 0.3 are refused until they upgrade; serving 0.3 too would mean a second set of method
  names and payload shapes.
- `WebhookUrlPolicy` and the guarded sender moved into `WebhookTransportModule`, shared by webhooks
  and escalation callbacks.
- Not in this version: streaming, A2A push notifications (the callback URL covers the reply),
  a signed Agent Card, retrying a failed callback, and replying from email.

## Registering in directories

Nothing is published yet. What each needs:

- **MCP Registry** (registry.modelcontextprotocol.io): a `server.json` with a reverse-DNS name. For
  `io.crossmart/…`, prove the domain with a DNS TXT record or an HTTP challenge on crossmart.io; or
  use `io.github.crossmart-io/…` with GitHub sign-in. List the remote server
  (`https://mcp.crossmart.io/mcp`, streamable HTTP) and, for the local server, the npm package with
  a matching `mcpName` in its `package.json`. Publish with `mcp-publisher login` and
  `mcp-publisher publish`.
- **A2A catalogs**: the Agent Card must be reachable at its well-known URI over https with the
  production URLs (set `API_PUBLIC_URL`). Catalogs and registries generally also ask for an icon
  (`iconUrl`), a documentation URL, terms of service and a privacy policy, a support contact, and
  increasingly a signed card (JWS, A2A §8.4). Add those before submitting.
