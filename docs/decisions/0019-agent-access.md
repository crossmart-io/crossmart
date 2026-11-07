# ADR 0019: Agents sign in with OAuth, and may open sandbox accounts

- Status: Accepted. Part 1 (OAuth) and part 2 (sandbox accounts) are implemented.
- Date: 2026-11-05 (part 2 implemented 2026-11-07)

## Context

Crossmart is built for sellers and their AI agents (ADR 0002). Today an agent reaches the MCP
server (`docs/mcp.md`) only with a workspace API key that a person creates and pastes into the
client. MCP clients such as Claude and ChatGPT expect the MCP authorization flow instead: the
server answers 401 with Protected Resource Metadata (RFC 9728), the client discovers the
authorization server, and the person signs in and approves in the browser. The MCP
authorization spec (since 2025-11-25; Better Auth's CIMD support follows the 2026-07-28 profile)
identifies clients by Client ID Metadata Documents (CIMD) and keeps Dynamic Client Registration
only as a fallback for older clients.

Client support is uneven (late 2026). Claude, ChatGPT, Codex and VS Code prefer CIMD. ChatGPT's
document declares `private_key_jwt`, and the others declare `none`. Gemini CLI, Copilot Studio,
Mistral Le Chat and Cursor register only through DCR. No published source covers Grok or
OpenClaw.

Agents also start work before their user has an account. An agent asked to "put my products on
Shopify" should be able to open a Crossmart account for the user, build the catalog, and hand it
over, without the user filling in a form first.

## Decision

**1. OAuth 2.1 for the MCP server, from Better Auth.**

- The API is the authorization server: Better Auth with `jwt()`, `@better-auth/mcp` (`mcp()`,
  which is built on `@better-auth/oauth-provider`) and `@better-auth/cimd` (`cimd()`, profile
  `mcp-2026-07-28`). Authorization server metadata advertises
  `client_id_metadata_document_supported` and the token endpoint auth methods `none` and
  `private_key_jwt`, so both Claude and ChatGPT use CIMD.
- **Dynamic Client Registration stays on as a fallback**, because several clients have no CIMD
  yet (see Context). It is open (no session) and restricted. It registers public clients only
  (`none`) with the authorization code grant, PKCE and the scopes below. It is rate-limited per
  IP (20 registrations an hour), and an hourly cleanup job deletes registrations that were never
  used within 24 hours. A self-registered client chooses its own name, so the consent page marks
  that name as unverified (see Consequences).
  Remove it once those clients adopt CIMD.
- The MCP server (`https://mcp.crossmart.io/mcp`, its own Railway service, set as
  `MCP_PUBLIC_URL` on both the API and the MCP server) is the protected resource. Without a token it
  answers 401 with a `WWW-Authenticate` header that points to its Protected Resource Metadata.
  It verifies access tokens against the API's JWKS: signature, issuer, audience (the MCP URL) and
  expiry. Nothing goes to the database for that.
- **Workspace at consent.** A token acts for one user in one workspace. A web app page shown after
  sign-in and before consent (`/oauth/workspace`) lists the user's workspaces, and the agent gets
  the chosen one. The token can never
  act outside it, and the user's role there caps what it can do. This uses the provider's
  post-login step: the web app's workspace page runs before consent, and `consentReferenceId`
  returns the chosen workspace. Consent is stored per workspace, and the workspace id goes into
  the access token as a namespaced claim.
- **Scopes:** `catalog:read`, `catalog:write`, `orders:read`, `stores:write`, `reports:read`,
  `suggestions:write` (ask for AI content, approve or reject), plus `offline_access` for refresh
  tokens. Read-only consent is a choice on the consent page. A call is allowed only when both the
  scope and the user's role permit it. The MCP server lists only the tools the token's scopes
  cover, and the API checks every call.
- Access tokens last 1 hour and refresh tokens 30 days (rotated), the provider's defaults.
  Revoking a connection under Settings revokes its tokens and consent, and the API refuses the
  connection's still-valid access tokens at once.
- The MCP server calls the API with the access token (`Authorization: Bearer`). The API accepts it
  as a new principal kind, `agent`, which is attributed to the user and labelled with the
  client's name in the activity log (actor type `agent`). Agents reach workspace routes only, and
  the per-caller rate limits count each agent and user separately. The API checks the audience itself and accepts only tokens
  issued for the MCP server. Both run in the same trust boundary, so this is not the token
  pass-through to a third-party API that the MCP spec forbids.
- API keys stay, for scripts and self-hosters.

**2. Agent-created sandbox accounts (after part 1).**

- The MCP server offers `create_account` without a token: the agent gives the user's email and a
  store name. Crossmart creates a user without a password, a workspace marked **sandbox**, and a
  token for the agent. It then emails the user a claim link.
- In a sandbox, the agent can build the catalog, stock and drafts. It cannot connect a channel,
  publish, invite members or pay. `EntitlementService` enforces this, and the API refuses with a
  message telling the agent to ask the user to claim the account.
- **Claiming:** the user opens the link, sets a password (or signs in with an existing account of
  the same email), and the workspace becomes a normal one in their organization. Connecting
  Shopify always needs the merchant's own OAuth consent.
- **Expiry:** an unclaimed sandbox is deleted after **14 days**. The claim email is resent once,
  after 3 days.
- **Limits:** one unclaimed sandbox per email address; at most **5 sandboxes per client per hour**
  and **50 per day**; at most **100 products** in an unclaimed sandbox.
- If the email already has an account, no sandbox is created. The agent is told to sign in
  through the normal flow, and no email is sent. This keeps the endpoint from revealing who is a
  customer.

## Consequences

- The web app needs a consent page (choose the workspace and read-only or full access) and a
  claim page. Connected agents need a revoke button under Settings.
- Better Auth's OAuth tables join the schema through an additive migration.
- Open DCR lets anyone register a client. Registrations are limited to public clients and
  rate-limited, and unused ones are deleted. Every grant still needs a signed-in user's consent.
- **Rate limits are shared in Redis.** Better Auth's limits (OAuth authorize 30 a minute, token 20
  a minute, registration 20 an hour, sign-in and its other defaults) count in the API's Redis
  through a custom storage (`RedisAuthRateLimitStorage`, keys
  `crossmart:auth-rate-limit:<client IP>|<path>`), so every instance shares one window and a
  deploy does not reset them. The client IP is the `x-real-ip` header Railway's edge sets
  (`CLIENT_IP_HEADERS`), the same address Ask's throttling uses. Better Auth enforces these
  limits in production only.
- **If Redis is down or slow** (a check waits at most 250 ms), the limits degrade by path:
  - **Client registration fails closed.** Anyone can call it without signing in, and every success
    leaves a lasting row. Refusing it for a while costs little, since agents retry and most use
    CIMD anyway, while an unlimited burst would be cleaned up only a day later.
  - **Everything else falls back to per-instance windows.** That covers sign-in, sign-up,
    password reset, authorize and token. Failing these closed would lock every person and agent
    out, and would break refresh-token rotation for connected agents, during a Redis outage.
    Failing fully open would remove the brute-force limit on sign-in. Per-instance windows keep a
    limit (at most the number of instances times the limit) without taking sign-in down.
  - The API logs once when it loses Redis and once when it is back, never with the key, which holds
    the caller's IP.
- **Unused clients are deleted.** The hourly maintenance sweep also deletes clients of either kind
  (CIMD or DCR, never one a user owns) that nobody has used for 90 days
  (`STALE_AGENT_CLIENT_TTL_MS`). Unused means: no consent (a consent is a live connection), no
  access or refresh token that is still valid or was issued in that time, no activity in that time,
  and no change to the client record in that time. A client with a live consent or
  an unexpired refresh token is never deleted. It works in batches of 200, checks the conditions
  again in the delete itself, and running it twice deletes nothing more. A CIMD client that comes
  back is simply fetched again. Before a client is deleted, its activity events keep its name
  (`actor_agent_name`) so the history still names the agent. Each workspace it worked in gets one
  `unused_agents_removed` event per sweep, naming the agents removed, and the worker logs the
  totals.
- **Unverified agent names are flagged.** Any self-registered client can call itself "Claude".
  `GET /api/v1/oauth/client` tells the consent page how the client is known: `metadata_document`
  with the `verifiedHost` its metadata came from, or `dynamic` with only a `claimedHost`. The page
  shows a CIMD client's name with the host it was verified from. For a DCR client it shows the name
  marked "unverified name", explains that the agent chose the name itself, and asks the user to
  continue only if they started this connection. Connections under Settings carry the same marker
  (`clientRegistration`, `clientVerifiedHost`).
- Activity, audit and rate limits need an `agent` actor alongside users and API keys.
- Sandbox accounts are a new abuse surface: account creation that sends email. The limits above,
  the 14-day expiry, sending no email for existing addresses, and the no-publish rule are the
  first defenses. Watch the creation rate after launch.
- Numbers marked in bold are product choices to confirm before part 2 ships. Part 2 uses them as
  written; they are constants (`SANDBOX_TTL_DAYS`, `SANDBOX_CLAIM_REMINDER_AFTER_MS`,
  `SANDBOX_MAX_PRODUCTS`, `SANDBOX_ACCOUNTS_PER_HOUR`, `SANDBOX_ACCOUNTS_PER_DAY`), not plan data.

## Part 2 as implemented

- **Data.** An additive table, `sandbox_accounts` (migration `20261115090000_sandbox_accounts`):
  one row per sandbox with its organization, workspace and user (each unique), the SHA-256 hash of
  the claim token, `expiresAt`, `claimEmailSentAt`, `claimEmailResentAt` and `claimedAt`. A
  workspace is a sandbox while its row has no `claimedAt`. The row stays after the claim, so a used
  link never works again. `WorkspaceDto.sandbox` (`claimExpiresAt`, or null) tells the web app.
- **Opening.** `POST /api/v1/sandbox-accounts` (public) and the MCP tool `create_account` take an
  email and a store name. One transaction creates a user without a password (named after the
  address's local part), an organization named after the store on the default plan, its workspace,
  the sandbox row and an **Editor API key** for the agent, which the answer returns once. The claim
  link goes to `{WEB_APP_URL}/claim?token=…`. The answer is `outcome: created` with `workspaceId`,
  `apiKey` and `claimExpiresAt`, or `outcome: sign_in_required` with nothing else, for every address
  that has an account, sandbox or not (compared case-insensitively, and again on the unique
  constraint if two requests race). Both carry a `nextStep` for the agent.
- **The agent's token is an API key**, not an OAuth access token. No OAuth client exists before
  the user signs in, so there is nothing to issue an access token to. An API key works with the
  REST API and with both MCP transports, and the activity log credits it ("AI agent (sandbox
  account)"). Editor is the least role that builds a catalog: it cannot manage members, keys,
  webhooks, stores or billing, and its AI suggestions still need approval. The key outlives the
  claim, so the agent can go on; the owner revokes it under Settings like any other key.
- **MCP.** `create_account` is offered only without a credential: by a local (stdio) server started
  without `CROSSMART_API_KEY`, which then adopts the returned key for the rest of the session. The
  remote server keeps answering 401 to requests without a token, because serving them would stop
  MCP clients from starting the OAuth sign-in. Agents on the remote server can call the REST
  endpoint directly.
- **Rate limits.** "Per client" is the caller's IP address (`x-real-ip`, as for Ask and Better
  Auth), since an anonymous request has no verified client identity. Two Redis windows,
  `sandbox-ip:<address>`, 5 an hour and 50 a day, count every call, including those answered
  `sign_in_required`, so the endpoint cannot be used to test many addresses.
- **Enforcement.** `EntitlementService.assertSandboxAllows(workspaceId, SandboxRestriction.…)`
  (and an organization variant) refuses with `SandboxRestrictedException`: HTTP 403, `code:
sandbox_claim_required`, the `restriction`, `claimExpiresAt`, and a message telling the agent to
  ask the user to claim the account. It applies whatever `ENTITLEMENTS_ENFORCED` says. Restricted:
  connecting a channel (`ChannelConnectionQuota`, also `error=sandbox_claim_required` on a
  callback), publishing (`ActiveListingsGate`), inviting members (`InvitationPolicy`), adding a
  workspace, and Crossmart AI content (`AiGateway`), which Crossmart pays for. `assertProductRoom`
  caps products at 100 (`ProductsService`, CSV create imports). Billing has no endpoint yet; the
  checkout must call `assertSandboxAllows` when it lands.
- **Claiming.** `POST /api/v1/sandbox-claims/preview` shows the link's address, store, expiry and
  whether the person already has a password. `POST /api/v1/sandbox-claims` with the token and a
  password sets the password (hashed by Better Auth), marks the address verified and claims, in one
  transaction that checks the sandbox is still unclaimed; the web app then signs in with them. A
  person who already has a password (a reset link is the only other way to one) signs in and calls
  `POST /api/v1/workspaces/{id}/sandbox/claim`, which only the sandbox's own user may call.
  Either way the workspace stays in the same organization, which becomes a normal one. Both are
  recorded as `sandbox_created` (by the agent's key) and `sandbox_claimed` (by the user).
- **Sweep.** The hourly maintenance job `sandbox-sweep` sends the reminder to sandboxes first
  emailed 3 days ago and not reminded yet, and deletes sandboxes past `expiresAt` with their
  organization, everything in it, and their user unless that user joined another workspace. It
  works in batches of 50 (at most 20 a run), and every write re-checks its conditions, so a second
  run changes nothing. Only the token's hash is stored, so the reminder carries a new link and the
  first one stops working; the reminder says so.
