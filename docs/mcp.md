# MCP server

`apps/mcp` lets AI agents (Claude, ChatGPT, Cursor and others) work with a Crossmart workspace
through the [Model Context Protocol](https://modelcontextprotocol.io). It never touches the
database: every tool calls the REST API with the agent's credential (an OAuth access token or a
workspace API key), so an agent gets the same validation, permissions and activity log as a
person in the dashboard.

## Running it

| Mode   | How                                                                  | Credential                                                    |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| Local  | `node dist/apps/mcp/main.js` (stdio), started by the MCP client      | `CROSSMART_API_KEY`                                           |
| Remote | `MCP_TRANSPORT=http node dist/apps/mcp/main.js`, answering at `/mcp` | Per request: an OAuth access token, or an API key (see below) |

| Variable                | Default                        | Meaning                                                       |
| ----------------------- | ------------------------------ | ------------------------------------------------------------- |
| `CROSSMART_API_URL`     | `http://localhost:3000`        | The Crossmart API the tools call                              |
| `MCP_TRANSPORT`         | `stdio`                        | `stdio` or `http`                                             |
| `PORT`                  | `3100`                         | Port of the remote server                                     |
| `CROSSMART_API_KEY`     |                                | The local server's key                                        |
| `MCP_PUBLIC_URL`        | `http://localhost:{PORT}/mcp`  | This server's public address; the API must use the same value |
| `CROSSMART_AUTH_ISSUER` | `{CROSSMART_API_URL}/api/auth` | The API's public auth URL, when the API is reached privately  |

The remote server is stateless: each POST builds a server for the request's credential and closes
it when the response ends, so any number of instances can run behind a load balancer.

## Connecting an agent

**Sign in with OAuth** ([ADR 0019](decisions/0019-agent-access.md)). Add the server's URL
(`https://mcp.crossmart.io/mcp`) as a custom connector in Claude, ChatGPT, Gemini, Grok or any MCP
client. The rest follows the MCP authorization spec:

1. Without a token, `/mcp` answers 401 with a `WWW-Authenticate` header pointing to the Protected
   Resource Metadata at `/.well-known/oauth-protected-resource/mcp` (RFC 9728).
2. The metadata names the API (`{API}/api/auth`) as the authorization server. Its discovery
   document is served at `/.well-known/oauth-authorization-server/api/auth`.
3. The client identifies itself with a Client ID Metadata Document (Claude, ChatGPT, Codex, VS
   Code), or registers as a public client (Cursor, Gemini CLI, Le Chat and others).
4. The user signs in to Crossmart, picks the workspace the agent will work in
   (`/oauth/workspace` in the web app), and approves its access (`/oauth/consent`), full or
   read-only.
5. The client gets an access token (1 hour, a JWT bound to `MCP_PUBLIC_URL`) and a refresh token
   (30 days, rotated).

An agent acts for the user who connected it, in one workspace. What it may do is its scopes
narrowed by that user's current role, and it never reaches members, API keys, store connections,
settings or billing. It only sees the tools its scopes cover. The activity log shows it as an
agent with the user's name. Members see and disconnect their agents under Settings (`GET/DELETE
/api/v1/workspaces/{id}/agent-connections`), and disconnecting stops the agent at once.

| Scope               | Tools                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog:read`      | `list_products`, `get_product`, `list_inventory`, `list_stores`, `get_inventory_item`, `get_store`, `list_store_products`, `get_product_stores`, `get_listing`, `get_sync_progress`, `list_suggestions` |
| `catalog:write`     | `create_product`, `replace_product`, `update_product_text`, `update_variant_price`, `adjust_stock`                                                                                                      |
| `orders:read`       | `list_orders`, `get_order`                                                                                                                                                                              |
| `stores:write`      | `add_product_to_store`, `remove_product_from_store`, `retry_store_listing`, `suggest_store_categories`, `set_store_category`, `get_item_specifics`, `save_item_specifics`, `update_listing`             |
| `reports:read`      | `get_sales_report`, `get_inventory_report`, `get_listing_health_report`                                                                                                                                 |
| `suggestions:write` | `generate_content`, `approve_suggestion`                                                                                                                                                                |
| `webhooks:write`    | `list_webhook_endpoints`, `create_webhook_endpoint`                                                                                                                                                     |

`ask_crossmart`, `escalate_to_crossmart_team`, `get_ask_escalation` and `get_platform_health` need
no scope. `ask_crossmart` reads the workspace only through the lookups its connection's permissions
allow (ADR 0025).

**Or open a sandbox account** (ADR 0019, part 2). A local server started without
`CROSSMART_API_KEY` adds `create_account` (`ANONYMOUS_TOOLS` in `tools/account.tools.ts`), which
calls `POST /api/v1/sandbox-accounts`. On `outcome: created` the server adopts the returned API
key (`CrossmartApiClient.adoptCredential`), so the session's other tools work in the new
workspace. The remote server keeps answering 401 without a token: serving anonymous sessions there
would stop MCP clients from starting OAuth, and every remote caller would share the MCP server's
address for the API's per-caller limits.

**Or use an API key**, for scripts and self-hosted setups: send it as `Authorization: Bearer <key>`
or `x-api-key`. A key works in exactly one workspace, which the server finds with
`GET /api/v1/api-key`, and every tool is offered; the key's role decides in the API.

## Tools

| Tool                         | Does                                                                   | Writes |
| ---------------------------- | ---------------------------------------------------------------------- | ------ |
| `list_products`              | Products by title, with price range, stock and status                  |        |
| `get_product`                | One product with its variants, stock, options and images               |        |
| `create_product`             | Adds a product with its variants (a draft unless `ACTIVE`)             | Yes    |
| `replace_product`            | Saves a whole product; variants left out are removed                   | Yes    |
| `update_product_text`        | Changes only a product's title and/or description                      | Yes    |
| `update_variant_price`       | Changes only one variant's price and/or compare-at price               | Yes    |
| `list_inventory`             | Stock per variant: on hand, held for orders, available                 |        |
| `get_inventory_item`         | One variant's stock with its product                                   |        |
| `adjust_stock`               | Adds, removes or sets stock, with a reason                             | Yes    |
| `list_orders`, `get_order`   | Orders from every store, without buyer details                         |        |
| `list_stores`, `get_store`   | Connected stores with their status and publish readiness               |        |
| `add_product_to_store`       | Lists a product on a store                                             | Yes    |
| `remove_product_from_store`  | Archives a product on a store                                          | Yes    |
| `list_store_products`        | A store's products by state or display state, with the reason          |        |
| `get_product_stores`         | One product on every store                                             |        |
| `retry_store_listing`        | Publishes one product to one store again                               | Yes    |
| `get_sync_progress`          | A store's sync: listings still pending, failed, and whether it is done |        |
| `get_listing`                | One listing field by field: product value, override, result            |        |
| `update_listing`             | Overrides fields of one listing, or reverts them with `null`           | Yes    |
| `suggest_store_categories`   | eBay categories that fit a product                                     |        |
| `set_store_category`         | Chooses a product's eBay category                                      | Yes    |
| `get_item_specifics`         | A listing's eBay item specifics and the category's aspects             |        |
| `save_item_specifics`        | Replaces a listing's eBay item specifics                               | Yes    |
| `get_sales_report`           | Sales, orders, average order value and units against the period before |        |
| `get_inventory_report`       | Stock value, stock levels and listings per store                       |        |
| `get_listing_health_report`  | Products by display state per store, and the latest failed listings    |        |
| `get_platform_health`        | Whether the API and database are up                                    |        |
| `generate_content`           | Queues AI titles and descriptions for products on a store              | Yes    |
| `list_suggestions`           | Proposed changes with current and proposed value and rationale         |        |
| `approve_suggestion`         | Applies a pending suggestion (or reports it `STALE`)                   | Yes    |
| `list_webhook_endpoints`     | The URLs the workspace sends events to, and which events each gets     |        |
| `create_webhook_endpoint`    | Adds a URL to send events to; its signing secret stays in the web app  | Yes    |
| `ask_crossmart`              | Answers about Crossmart (and, read-only, the workspace)                |        |
| `escalate_to_crossmart_team` | Hands an Ask conversation to the Crossmart team, who reply by email    | Yes    |
| `get_ask_escalation`         | Reads the team's reply to an escalated question (ADR 0025)             |        |
| `create_account`             | Opens a sandbox account; only offered without a credential (ADR 0019)  | Yes    |

Every tool carries `readOnlyHint`, `destructiveHint` and `openWorldHint` (`toolAnnotations` in
`apps/mcp/src/tools/tool-annotations.ts`), so clients can ask before running a risky call:

- **Destructive:** tools that delete or take something off sale (`replace_product`,
  `remove_product_from_store`, `save_item_specifics`), and tools that overwrite a live value
  (`update_product_text`, `update_variant_price`, `adjust_stock`, `update_listing`,
  `set_store_category`, `approve_suggestion`).
- **Open-world:** tools that publish to a store or send data out of Crossmart: every destructive
  tool above, `add_product_to_store`, `retry_store_listing`, `create_webhook_endpoint`,
  `escalate_to_crossmart_team` and `create_account`.
- Neither: the read tools, `create_product` (a draft until added to a store) and
  `generate_content` (its results wait as suggestions).

Tool results never carry credentials: `create_webhook_endpoint` answers with the endpoint and where
to get its signing secret (Settings > Webhooks in the web app, Rotate secret), while
`POST /webhook-endpoints` in the REST API still returns it once. `ask_crossmart` only asks; reaching
a person is `escalate_to_crossmart_team`, which takes a `contactEmail` but not the REST API's
`callbackUrl`. When the API refuses a call, the tool returns an error with the API's message (for
example `Crossmart refused (404): Product not found`) instead of failing the session.

AI content goes through review: `generate_content` only creates pending suggestions, and
`approve_suggestion` needs a key whose role holds `suggestions:approve` (Owner, Admin or
Approver), so an agent with an Editor key can propose but never apply.

Connecting a store always needs the merchant: channel OAuth (Shopify and others) runs in the
dashboard, never through an agent.

Webhook endpoints send workspace data to a URL the agent names, so they have a scope of their own
(`webhooks:write`) and need a role holding `webhooks:manage` (Owner or Admin). An agent can list
and add endpoints, so its own backend gets events as they happen
([webhooks](developers/webhooks.md)); changing, turning off and deleting them stays in the
dashboard and the REST API.

## Adding a tool

Each tool is a spec in `libs/core/src/agent-tools/tools/*.tools.ts`: a name, a description written
for the agent, a zod input and the API call it makes (`defineTool`). Add it to the group's list;
`ALL_TOOLS` registers it. Keep one tool per endpoint and describe what the agent should read first.
The specs are shared with [Agent Worker](agent-worker.md), the agent inside the web app, which
offers the same tools and proposes every write for approval; mark `destructive`, `publishes` and
`priceInputs` where they apply. `destructive` (deletes or takes off sale) also shows as a risk on
Agent Worker's approval cards; `overwrites` (replaces a live value) and `openWorld` (publishes to
a store or sends data out) only set the MCP hints. `toResult` shapes what the agent reads of the
API's answer, such as leaving a secret out.

A spec may add `refusalHints`: a next step per HTTP status, appended to the API's message when it
refuses the call. Tools that return listings include `LISTING_STATE_GUIDE`
(`agent-tools/tools/listing-guidance.ts`), which maps every `PublishRequirement` to the tool the agent uses next;
a new requirement fails the typecheck until it has a step. The guide reads `displayRequirement`
first, so it keeps working when the API adds that field.
