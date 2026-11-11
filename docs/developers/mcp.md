# Connect an AI agent (MCP)

Crossmart has a [Model Context Protocol](https://modelcontextprotocol.io) server, so AI agents such
as Claude, ChatGPT and Cursor can work with a seller's catalog: look up products and stock, create
products, publish them to stores, read orders and reports, and propose AI-written content for review.

The MCP server never touches the database. Every tool calls the [REST API](README.md) with the
agent's credentials, so an agent gets the same validation, permissions and activity log as a
person in the dashboard.

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| Hosted server  | `https://mcp.crossmart.io/mcp` (Streamable HTTP)             |
| Authentication | OAuth sign-in, or a workspace API key                        |
| Source         | [`apps/mcp`](../../apps/mcp) ([maintainer notes](../mcp.md)) |

**Setup guides for each agent** (Claude, ChatGPT, Cursor, Windsurf, VS Code, Zed, Cline, Continue,
Codex, Gemini CLI, OpenClaw, Meta Muse, Goose, Hermes Agent) are in [agents/](agents/README.md).
The [Crossmart agent skill](../../skills/README.md) teaches an agent the seller workflows on top of
these tools; it installs in any agent that reads `SKILL.md` files.

## Connect with an API key

1. In the dashboard, open **Settings → Developers → API keys** and create a key for the agent. Name it after the
   agent (for example "Claude Desktop") so it is easy to find and revoke.
2. Pick the role that matches what the agent may do:
   - **Viewer**: questions only ("which products are low on stock?").
   - **Editor**: also edit products and stock, publish to stores and generate content. AI content
     still waits for a person to approve it.
   - **Approver** or **Admin**: may also approve suggestions. Give an agent this only on purpose.
3. Give the key to your MCP client. The remote server reads it from the `x-api-key` header or from
   `Authorization: Bearer <key>`.

A key works in exactly one workspace, so the agent always knows which business it is working on.

### Claude Code

```bash
claude mcp add --transport http crossmart https://mcp.crossmart.io/mcp \
  --header "x-api-key: cm_…"
```

### Cursor and other clients that take headers

The exact file and field names differ per client; see [agents/](agents/README.md).

```json
{
  "mcpServers": {
    "crossmart": {
      "url": "https://mcp.crossmart.io/mcp",
      "headers": { "x-api-key": "cm_…" }
    }
  }
}
```

### Claude Desktop (local server)

Claude Desktop starts local MCP servers itself (or use the `mcp-remote` bridge, see
[Claude Desktop](agents/claude-desktop.md)). Build the server from this repository
(`pnpm install && pnpm build:mcp`) and add it to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "crossmart": {
      "command": "node",
      "args": ["/path/to/crossmart/dist/apps/mcp/main.js"],
      "env": {
        "CROSSMART_API_KEY": "cm_…",
        "CROSSMART_API_URL": "https://api.crossmart.io"
      }
    }
  }
}
```

The local server talks to the API over stdio; `CROSSMART_API_URL` defaults to
`http://localhost:3000`, so set it for the hosted API.

### Claude.ai, ChatGPT and Meta Muse

Their connectors sign in with OAuth rather than a pasted key. Add the server's URL and choose
sign-in: the seller signs in to Crossmart, chooses a workspace and approves what the agent may do
(read the catalog, write it, read orders, manage store listings, read reports, propose
suggestions). The agent is offered only the tools those scopes cover. The
[agent guides](agents/README.md) have the steps for each client.

## Changes wait for your approval

Unless you choose otherwise, an agent's changes over MCP don't apply on their own. A write tool
answers `"status": "proposed"` with a `proposalId`, and the change waits under **Agent
proposals** in the dashboard with a before-and-after preview. You approve or reject it there;
deletions, price changes and changes to more than 5 items need an extra confirmation. Approved
changes are made as the agent and logged as "Claude for Dana, approved by Lee". The agent can
check a proposal with `get_proposal`; proposals nobody decides expire after 7 days.

One change doesn't wait: **new products created as drafts**. A draft isn't listed or for sale
anywhere, so `create_product` without a status (or with `DRAFT`) adds it at once and tells the
agent it is a draft. It shows in your activity log, credited to the agent. Making it active,
publishing it to a store, and any later change to it still wait for you. A product the agent
creates as `ACTIVE` waits for your approval like any other change.

This applies to every MCP session, whether the agent signed in with OAuth or uses an API key.
Owners and Admins can turn it off under **Settings → General → Outside agents' changes**
("Apply directly"). Reading is never affected, and neither are scripts and integrations (such as
n8n) that call the REST API with an API key.

## Tools

| Tool                         | Does                                                                   | Changes data |
| ---------------------------- | ---------------------------------------------------------------------- | :----------: |
| `get_started`                | What the account still needs, who does each step, and links            |              |
| `list_products`              | Products by title, with price range, stock and status                  |              |
| `get_product`                | One product with its variants, stock, options and images               |              |
| `create_product`             | Adds a product with its variants (a draft unless `ACTIVE`)             |     Yes      |
| `replace_product`            | Saves a whole product; variants left out are removed                   |     Yes      |
| `update_product_text`        | Changes only a product's title and/or description                      |     Yes      |
| `update_variant_price`       | Changes only one variant's price and/or compare-at price               |     Yes      |
| `mark_product_sold`          | Sold elsewhere: stock to 0 and off every store; safe to repeat         |     Yes      |
| `list_inventory`             | Stock per variant: on hand, held for orders, available                 |              |
| `get_inventory_item`         | One variant's stock with its product                                   |              |
| `adjust_stock`               | Adds, removes or sets stock, with a reason                             |     Yes      |
| `list_orders`                | Orders from every store (Shopify, eBay…), without buyer details        |              |
| `get_order`                  | One order with its lines and the stock each line holds or has shipped  |              |
| `list_stores`                | Connected stores with their status and publish readiness               |              |
| `get_store`                  | One store, with what its setup still needs before it can publish       |              |
| `add_product_to_store`       | Lists a product on a store                                             |     Yes      |
| `remove_product_from_store`  | Takes a product off a store; it keeps its order history                |     Yes      |
| `list_store_products`        | A store's products by state or `displayState`, with counts             |              |
| `get_product_stores`         | One product on every store, with its display state and reason          |              |
| `retry_store_listing`        | Publishes one product to one store again                               |     Yes      |
| `get_sync_progress`          | A store's sync: listings still pending, failed, and whether it is done |              |
| `get_listing`                | One listing field by field, with each variant's rule price             |              |
| `update_listing`             | Overrides fields of one listing, or reverts them with `null`           |     Yes      |
| `suggest_store_categories`   | eBay categories that fit a product                                     |              |
| `set_store_category`         | Chooses a product's eBay category                                      |     Yes      |
| `get_item_specifics`         | A listing's eBay item specifics: required, recommended, allowed values |              |
| `save_item_specifics`        | Replaces a listing's eBay item specifics                               |     Yes      |
| `get_sales_report`           | Sales, orders, average order value and units against the period before |              |
| `get_inventory_report`       | Stock value, stock levels and listings per store                       |              |
| `get_listing_health_report`  | Products by display state per store, and the latest failed listings    |              |
| `get_platform_health`        | Whether the API and its database are reachable                         |              |
| `generate_content`           | Queues AI titles and descriptions for products on a store              |     Yes      |
| `list_suggestions`           | Proposed changes with current and proposed value and rationale         |              |
| `approve_suggestion`         | Applies a pending suggestion (or reports it `STALE`)                   |     Yes      |
| `list_webhook_endpoints`     | The URLs the workspace sends events to, and which events each gets     |              |
| `create_webhook_endpoint`    | Adds a URL to send events to; get its signing secret in the dashboard  |     Yes      |
| `ask_crossmart`              | Answers about Crossmart from its docs, with sources, and follow-ups    |              |
| `escalate_to_crossmart_team` | Hands an Ask conversation to the Crossmart team, who reply by email    |     Yes      |
| `get_ask_escalation`         | Reads the Crossmart team's reply to an escalated question              |              |
| `get_proposal`               | Where a change the agent proposed stands: pending, applied, rejected…  |              |
| `create_account`             | Opens a sandbox account for a user who has none (local server only)    |     Yes      |

Every tool tells the client whether it only reads (`readOnlyHint`), whether it deletes or
overwrites something (`destructiveHint`: `replace_product`, `mark_product_sold`, `remove_product_from_store`,
`save_item_specifics`, `update_product_text`, `update_variant_price`, `adjust_stock`,
`update_listing`, `set_store_category` and `approve_suggestion`), and whether it reaches beyond
Crossmart (`openWorldHint`: those same tools, which change what your stores show, plus
`add_product_to_store`, `retry_store_listing`, `create_webhook_endpoint`,
`escalate_to_crossmart_team` and `create_account`), so clients can ask before running them.
`mark_product_sold` is also `idempotentHint`: calling it again changes nothing. Tool
results never hold secrets: `create_webhook_endpoint` leaves out the signing secret, which you get
under Settings > Developers > Webhooks (Rotate secret). When the API refuses a call, the tool returns the API's
status, its `code` when it gives one, and its message (for example
`Crossmart refused (404): Product not found`) instead of failing the session. Some tools add a next
step: `retry_store_listing` explains a `409` (the store is not connected or does
not select the product) and a `402` (no room on the plan).

## First steps in a new account

Just signed up? The agent starts with `get_started`, which says what the account still needs and
who does each step:

1. **Add products.** The agent can do this at once with `create_product`; no store is needed. Tell
   it what you sell (titles, condition, prices, quantities, photo links) and it drafts the
   listings. New products are drafts and don't wait for your approval; making them active or
   publishing them does.
2. **Connect a store.** Only you can: the agent sends you a link such as
   `https://app.crossmart.io/stores?connect=shopify`, and you sign in to the channel there.
3. **Publish.** With a product and a store, the agent lists it with `add_product_to_store`.
4. **Confirm your email** from the email Crossmart sent when you signed up.

When `list_products` or `list_stores` finds nothing in a new account, the answer comes with a
second block, `{"next": {...}}`, that points the agent to these steps. The answer itself is
unchanged.

## Listing states and what to do next

Every product on a store has one `displayState`: `draft`, `needs_details`, `ready`, `publishing`,
`published`, `failed`, `removing` or `removed`, with a `displayReason` for `needs_details` and
`failed`. `list_store_products`, `get_product_stores`, `add_product_to_store` and
`retry_store_listing` return it, and their descriptions tell the agent how to act:

| Missing                                                                                                  | Next step                                                                               |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Store setup: `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup` | The merchant finishes it in the dashboard (`publishReadiness.missing` on `list_stores`) |
| `reconnect`, `account_settings`                                                                          | The merchant connects the store again                                                   |
| `category`                                                                                               | `suggest_store_categories`, then `set_store_category`                                   |
| `item_specifics`                                                                                         | `get_item_specifics`, then `save_item_specifics`                                        |
| `images`, `active_product`, `option_names`                                                               | Fix the product with `replace_product`                                                  |

Then `retry_store_listing` sends the listing again. The agent reads the requirement from
`displayRequirement` when the API returns it, otherwise from `listing.missingRequirement`, and
otherwise shows the merchant `displayReason`.

Orders from every channel, eBay included, share one API: `list_orders` returns them all, each with
its `channel`, and `connectionId` narrows them to one store.

## No account yet?

Started without a key, the local server (`CROSSMART_API_KEY` unset) also offers `create_account`:
give it the user's email and a store name, and it opens a **sandbox account** for them, emails them
a link to claim it, and from then on works in that account with the key it got. The answer's
`apiKey` also works as `Authorization: Bearer <key>` with the remote server. In a sandbox the agent
can build products (up to 100), stock and drafts; connecting stores, publishing, inviting people
and Crossmart AI wait until the user claims it, and the tools say so (`sandbox_claim_required`).
An unclaimed account is deleted after 14 days. If the email already has an account, nothing is
opened: ask the user to sign in with OAuth. See
[sandbox accounts](README.md#sandbox-accounts-for-ai-agents).

The remote server (`https://mcp.crossmart.io/mcp`) does not offer `create_account`: without a
token it answers 401, which is how MCP clients know to start the OAuth sign-in.

## What agents can't do

- **Connect a store.** Marketplaces ask the seller to approve access, so stores are connected in the
  dashboard, never by an agent.
- **Apply AI content on their own** (with an Editor key). `generate_content` only creates pending
  suggestions; a person with the Approver, Admin or Owner role reviews them in the dashboard, under
  Agent > Review.
- **Act outside their workspace.** A key only reaches its own workspace.

## Try it

Once connected, ask the agent things like:

- "What should I do first?" (in a new account)
- "Which products are out of stock, and on which stores are they listed?"
- "Create a draft product for a blue ceramic mug at $18 with 25 in stock."
- "Add every active mug to my Shopify store."
- "How did sales in the last 7 days compare with the week before?"
- "Write better titles for my 10 best sellers on eBay." (they arrive as suggestions to approve)
- "Which of my eBay listings failed, and what do they need?"
- "What does my eBay store still need before it can publish?"

## Self-hosting

Run the remote server next to your own API:

```bash
pnpm build:mcp
MCP_TRANSPORT=http CROSSMART_API_URL=http://localhost:3000 PORT=3100 node dist/apps/mcp/main.js
# answers at http://localhost:3100/mcp
```

The server is stateless, so you can run several instances behind a load balancer. It logs one
line per session, tool list and tool call (ids, outcomes and timings, never what was sent or
returned); see the [maintainer notes](../mcp.md#request-log), which also explain how tools are
defined.
