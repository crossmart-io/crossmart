# ADR 0019: Agents sign in with OAuth, and may open sandbox accounts

- Status: Accepted
- Date: 2026-11-05

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
  used within 24 hours.
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
- Activity, audit and rate limits need an `agent` actor alongside users and API keys.
- Sandbox accounts are a new abuse surface: account creation that sends email. The limits above,
  the 14-day expiry, sending no email for existing addresses, and the no-publish rule are the
  first defenses. Watch the creation rate after launch.
- Numbers marked in bold are product choices to confirm before part 2 ships.
