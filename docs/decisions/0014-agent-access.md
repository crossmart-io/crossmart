# ADR 0014: Agents sign in with OAuth, and may open sandbox accounts

- Status: Proposed
- Date: 2026-11-04

## Context

Crossmart is built for sellers and their AI agents (ADR 0002). Today an agent reaches the MCP
server (`docs/mcp.md`) only with a workspace API key that a person creates and pastes into the
client. MCP clients such as Claude and ChatGPT expect the MCP authorization flow instead: the
server answers 401 with Protected Resource Metadata (RFC 9728), the client discovers the
authorization server, and the person signs in and approves in the browser. The MCP 2026-07-28
profile identifies clients by Client ID Metadata Documents (CIMD) and keeps Dynamic Client
Registration only as a deprecated fallback.

Agents also start work before their user has an account. An agent asked to "put my products on
Shopify" should be able to open a Crossmart account for the user, build the catalog, and hand it
over, without the user filling in a form first.

## Decision

**1. OAuth 2.1 for the MCP server, from Better Auth.**

- The API is the authorization server: Better Auth with `jwt()`, `@better-auth/mcp` (`mcp()`,
  which is the OAuth provider) and `@better-auth/cimd` (`cimd()`, profile `mcp-2026-07-28`).
  Dynamic Client Registration stays off.
- The MCP server (`https://mcp.crossmart.io/mcp`) is the protected resource. Without a token it
  answers 401 with a `WWW-Authenticate` header that points to its Protected Resource Metadata.
  It verifies access tokens against the API's JWKS: signature, issuer, audience (the MCP URL) and
  expiry. Nothing goes to the database for that.
- **Workspace at consent.** A token acts for one user in one workspace. The consent page, in the web
  app, lists the user's workspaces and the agent picks up the chosen one. The token can never
  act outside it, and the user's role there caps what it can do.
- **Scopes:** `catalog:read`, `catalog:write`, `orders:read`, `stores:write`, `reports:read`.
  Read-only consent is a choice on the consent page. Tools check their scope.
- The MCP server calls the API with the access token. The API accepts it as a new principal kind,
  `OAuthClient`, which is attributed to the user and labelled with the client's name in the
  activity log (actor type `agent`).
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
- Activity, audit and rate limits need an `agent` actor alongside users and API keys.
- Sandbox accounts are a new abuse surface: account creation that sends email. The limits above,
  the 14-day expiry, sending no email for existing addresses, and the no-publish rule are the
  first defenses. Watch the creation rate after launch.
- Numbers marked in bold are product choices to confirm before part 2 ships.
