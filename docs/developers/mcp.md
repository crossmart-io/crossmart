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
| Authentication | A workspace API key today; OAuth for agents is coming        |
| Source         | [`apps/mcp`](../../apps/mcp) ([maintainer notes](../mcp.md)) |

## Connect with an API key

1. In the dashboard, open **Settings → API keys** and create a key for the agent. Name it after the
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

Claude Desktop starts local MCP servers itself. Build the server from this repository
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

### Claude.ai and ChatGPT

Their connectors sign in with OAuth rather than a pasted key. Agent OAuth is being added: the seller
will sign in, choose a workspace and approve what the agent may do (read the catalog, write it,
read orders, manage store listings, read reports, propose suggestions). Until then, use one of the
clients above.

## Tools

| Tool                        | Does                                                                   | Changes data |
| --------------------------- | ---------------------------------------------------------------------- | :----------: |
| `list_products`             | Products by title, with price range, stock and status                  |              |
| `get_product`               | One product with its variants, stock, options and images               |              |
| `create_product`            | Adds a product with its variants (a draft unless `ACTIVE`)             |     Yes      |
| `replace_product`           | Saves a whole product; variants left out are removed                   |     Yes      |
| `list_inventory`            | Stock per variant: on hand, held for orders, available                 |              |
| `adjust_stock`              | Adds, removes or sets stock, with a reason                             |     Yes      |
| `list_orders`               | Orders from every store, without buyer details                         |              |
| `get_order`                 | One order with its lines and the stock each line holds or has shipped  |              |
| `list_stores`               | Connected stores with their status                                     |              |
| `add_product_to_store`      | Lists a product on a store                                             |     Yes      |
| `remove_product_from_store` | Takes a product off a store; it keeps its order history                |     Yes      |
| `get_sales_report`          | Sales, orders, average order value and units against the period before |              |
| `get_inventory_report`      | Stock value, stock levels and listings per store                       |              |
| `get_platform_health`       | Whether the API and its database are reachable                         |              |
| `generate_content`          | Queues AI titles and descriptions for products on a store              |     Yes      |
| `list_suggestions`          | Proposed changes with current and proposed value and rationale         |              |
| `approve_suggestion`        | Applies a pending suggestion (or reports it `STALE`)                   |     Yes      |

Read-only tools are marked `readOnlyHint`, and `replace_product` and `remove_product_from_store`
are marked `destructiveHint`, so clients can ask before running them. When the API refuses a call,
the tool returns the API's message (for example `Crossmart refused (404): Product not found`)
instead of failing the session.

## What agents can't do

- **Connect a store.** Marketplaces ask the seller to approve access, so stores are connected in the
  dashboard, never by an agent.
- **Apply AI content on their own** (with an Editor key). `generate_content` only creates pending
  suggestions; a person with the Approver, Admin or Owner role reviews them in the dashboard's
  Suggestions inbox.
- **Act outside their workspace.** A key only reaches its own workspace.

## Try it

Once connected, ask the agent things like:

- "Which products are out of stock, and on which stores are they listed?"
- "Create a draft product for a blue ceramic mug at $18 with 25 in stock."
- "Add every active mug to my Shopify store."
- "How did sales in the last 7 days compare with the week before?"
- "Write better titles for my 10 best sellers on eBay." (they arrive as suggestions to approve)

## Self-hosting

Run the remote server next to your own API:

```bash
pnpm build:mcp
MCP_TRANSPORT=http CROSSMART_API_URL=http://localhost:3000 PORT=3100 node dist/apps/mcp/main.js
# answers at http://localhost:3100/mcp
```

The server is stateless, so you can run several instances behind a load balancer. See the
[maintainer notes](../mcp.md) for how tools are defined.
