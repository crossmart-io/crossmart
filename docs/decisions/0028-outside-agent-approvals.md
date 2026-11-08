# ADR 0028: Changes by outside agents wait for the seller's approval

- Status: Accepted
- Date: 2026-11-08
- Builds on: agent access ([ADR 0019](0019-agent-access.md)), Agent Worker ([ADR 0026](0026-agent-worker.md))
  and the workspace event stream ([ADR 0027](0027-workspace-event-stream.md)).

## Context

Crossmart promises "every change waits for your approval". Crossmart Agent keeps it (ADR 0026):
it reads freely and only proposes. Outside agents did not: Claude, ChatGPT or any MCP client a
seller connected applied every write the moment it called the tool, limited only by its scopes and
the person's role. The promise has to hold for them too, without breaking the MCP clients and
integrations already connected.

## Decision

### 1. A workspace setting, on by default

`workspaces.outside_agent_changes` (text holding `OutsideAgentChanges`):

- `require_approval` (the default, for every workspace, existing ones included): an outside
  agent's change becomes a **proposal** the seller approves or rejects in the app.
- `apply_directly`: outside agents change things at once, as before.

Owners and Admins change it under Settings > Workspace (`PATCH /workspaces/{id}` with
`outsideAgentChanges`, permission `workspace:manage`). Only a signed-in person may change it: an
API key or agent that sends the field gets 403, so an agent can never turn its own approvals off.
Each change is recorded in the activity log (`outside_agent_changes_changed`).

A per-agent override (one connected agent trusted to apply directly) is left for later: it needs
its own table keyed by workspace and OAuth client, and the workspace-wide switch covers the need.

### 2. Who counts as an outside agent

| Caller                                                   | Write tools / writes                                    |
| -------------------------------------------------------- | ------------------------------------------------------- |
| A connected agent with an OAuth access token, over MCP   | Proposed                                                |
| A connected agent with an OAuth access token, over REST  | Refused with 403 `agent_approval_required`; it proposes |
| Any MCP session with an API key (stdio or remote)        | Proposed                                                |
| An API key over REST (scripts, n8n, the SDKs, sync jobs) | Applied directly, as before                             |
| A signed-in person in the web app                        | Applied directly                                        |
| Crossmart Agent (in the app)                             | Unchanged: its own approval cards (ADR 0026)            |

The line is the channel, not a flag on the key. An OAuth client is always an agent: people never
hold OAuth tokens. The MCP server is used only by agents, so every write tool it offers proposes,
whatever credential the session carries. An API key used over REST is an integration the owner
created on purpose, and it keeps working directly: flagging keys as "agent" would be a promise the
API cannot check, since any program can hold any key. A key the sandbox flow gave an agent (ADR 0019) is still a key: before the claim there is nobody to approve, and after it the owner can
revoke it. Agents that must be gated should connect with OAuth.

### 3. The proposal

`POST /api/v1/workspaces/{workspaceId}/agent-proposals` takes `{ tool, input }`: a write tool of
the shared registry (`libs/core/src/agent-tools`) and its input. Only agents and API keys may call
it. The API checks that the tool exists, needs approval (§4) and that the input passes the tool's
strict zod schema (400 otherwise), and that the caller's permissions cover the tool's scope (403).
Then, by the setting:

- `apply_directly`: it answers `outcome: apply_directly` and stores nothing; the MCP server makes
  the call itself as before. A REST agent calls the route directly.
- `require_approval`: it stores a proposal and answers `outcome: proposed` with it. The preview is
  made by **Agent Worker's typed formatters** (`libs/core/src/agent-worker/previews`), reading the
  current values through the API over loopback **with the caller's own credential**, so a
  proposal shows only what its agent may read. Risks come from the same `assessRisks`
  (`destructive`, `price_change`, `bulk` above 5 items); there is no second preview system.

The MCP tool answers the agent with text, not an error: "Proposed; waiting for the seller's
approval in Crossmart", the proposal id and its expiry, and to check later with `get_proposal`.
`get_proposal` (read-only, every connection) reads `GET …/agent-proposals/{id}`: an agent or key
sees only proposals it made; anyone else gets 404. Status is `pending`, `applying`, `applied`
(with the API's answer), `failed` (with the refusal), `rejected` or `expired`.

Existing MCP clients need no change: the tools, names and inputs are the same, and they read the
proposed result like any tool result.

### 4. Which tools need approval

A tool needs approval when it is not read-only, belongs to the workspace (it has a scope), and is
not marked `approvalExempt`. `generate_content` is exempt: it changes nothing in the catalog and
its output already waits in the suggestions inbox. `create_account` and the Ask tools act outside
any workspace. Read tools are unaffected. On the REST side the same split is made by HTTP method
(anything but GET, HEAD and OPTIONS on a workspace route) with the same exemptions
(`@AgentApprovalExempt()`): content generation and the proposal routes themselves.

### 5. Deciding

`GET …/agent-proposals?status=` (the list, newest first, with a total) and `GET …/{id}` need
`suggestions:view`. `POST …/{id}/approve` (`confirmHighRisk` for risky ones, as ADR 0026) and
`POST …/{id}/reject` are for signed-in people with `suggestions:approve`, who must also hold the
tool's own permission. The suggestions permissions fit: they already mean "see and decide what
agents propose".

- **Claim once.** Approving moves `pending` to `applying` with a conditional update that also
  checks the expiry, so a change runs once even if two people approve together.
- **Applied as the agent.** The API calls itself over loopback with a two-minute credential
  (`x-crossmart-agent-proposal`, a JWT signed with a key derived from `BETTER_AUTH_SECRET` for
  this purpose only, accepted only from a loopback address). It names the proposal, which must be
  `applying`. The principal is the proposer **as it is now**: the OAuth connection must still
  stand (a revoked agent's proposal fails), the key must not be revoked, and the scopes are
  narrowed by the user's current role. So the change goes through every guard any call meets.
- **Activity.** The actor carries `approvedByUserId` (new nullable column
  `activity_events.actor_approved_by_id`), so the log reads "Claude for Dana, approved by Lee".
  The activity view and DTO gain `actor.approvedByName`.
- **Reject** records `agent_proposal_rejected`. Approving records nothing of its own: the change
  itself is in the log, credited as above.

### 6. Expiry

A proposal waits `AGENT_PROPOSAL_TTL_DAYS` (7) days. Reads treat a pending proposal past its
`expires_at` as expired at once; an hourly maintenance job (`agent-proposal-expiry`) marks them
`expired` in batches. The agent then reads `expired` from `get_proposal`.

### 7. Where the seller sees them

- **Agent proposals**, a page next to Suggestions, with a count in the sidebar: tabs by status,
  one approval card per proposal, built from Crossmart Agent's card parts (before and after, risk
  badges and the confirmation). Suggestions stay content suggestions for one listing; a proposal
  is any tool call, as in Crossmart Agent.
- **The event stream** gets a source, `AgentProposalEventSource` (needs `suggestions:view`):
  `agent.proposal_received`, `agent.proposal_approved`, `agent.proposal_rejected`,
  `agent.proposal_expired` and `agent.proposal_failed`, each with the new ref `proposalId`. The
  applied change itself comes through the activity source.
- **The bell** shows "Agent proposals are waiting" while any are pending.

### 8. Data

Migration `20261121100000_agent_proposals`, additive: the `agent_proposals` table (workspace,
proposer kind, user, OAuth client or API key, agent name, scopes, tool, input, risks, summary,
preview, status, result, decided by and at, finished at, expires at), the workspace column with
its default, and the activity column. Proposals are deleted with their workspace.

## Consequences

- "Every change waits for your approval" is true for every agent by default. A seller who wants
  the old behaviour turns it off once.
- An agent waits for a person. It is told so, with an id to check, and the MCP instructions tell
  it to tell the user.
- One more round trip per write over MCP (the proposal request) when changes apply directly.
- An API key with write access over REST still writes directly. That is a choice the owner makes
  when creating the key, and the docs say so.
- Not in this version: a per-agent override, approving many proposals in one call, notifying the
  agent (it polls), and email notices.
