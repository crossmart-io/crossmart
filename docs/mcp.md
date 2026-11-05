# MCP server

`apps/mcp` lets AI agents (Claude, ChatGPT, Cursor and others) work with a Crossmart workspace
through the [Model Context Protocol](https://modelcontextprotocol.io). It never touches the
database: every tool calls the REST API with a workspace API key, so an agent gets the same
validation, permissions and activity log as a person in the dashboard.

## Running it

| Mode   | How                                                                  | API key                                                   |
| ------ | -------------------------------------------------------------------- | --------------------------------------------------------- |
| Local  | `node dist/apps/mcp/main.js` (stdio), started by the MCP client      | `CROSSMART_API_KEY`                                       |
| Remote | `MCP_TRANSPORT=http node dist/apps/mcp/main.js`, answering at `/mcp` | Per request: `Authorization: Bearer <key>` or `x-api-key` |

| Variable            | Default                 | Meaning                          |
| ------------------- | ----------------------- | -------------------------------- |
| `CROSSMART_API_URL` | `http://localhost:3000` | The Crossmart API the tools call |
| `MCP_TRANSPORT`     | `stdio`                 | `stdio` or `http`                |
| `PORT`              | `3100`                  | Port of the remote server        |
| `CROSSMART_API_KEY` |                         | The local server's key           |

The remote server is stateless: each POST builds a server for the request's key and closes it
when the response ends, so any number of instances can run behind a load balancer. A key works
in exactly one workspace; the server finds it with `GET /api/v1/api-key`.

## Tools

| Tool                        | Does                                                                   | Writes |
| --------------------------- | ---------------------------------------------------------------------- | ------ |
| `list_products`             | Products by title, with price range, stock and status                  |        |
| `get_product`               | One product with its variants, stock, options and images               |        |
| `create_product`            | Adds a product with its variants (a draft unless `ACTIVE`)             | Yes    |
| `replace_product`           | Saves a whole product; variants left out are removed                   | Yes    |
| `list_inventory`            | Stock per variant: on hand, held for orders, available                 |        |
| `adjust_stock`              | Adds, removes or sets stock, with a reason                             | Yes    |
| `list_orders`, `get_order`  | Orders from every store, without buyer details                         |        |
| `list_stores`               | Connected stores with their status                                     |        |
| `add_product_to_store`      | Lists a product on a store                                             | Yes    |
| `remove_product_from_store` | Archives a product on a store                                          | Yes    |
| `get_sales_report`          | Sales, orders, average order value and units against the period before |        |
| `get_inventory_report`      | Stock value, stock levels and listings per store                       |        |
| `get_platform_health`       | Whether the API and database are up                                    |        |
| `generate_content`          | Queues AI titles and descriptions for products on a store              | Yes    |
| `list_suggestions`          | Proposed changes with current and proposed value and rationale         |        |
| `approve_suggestion`        | Applies a pending suggestion (or reports it `STALE`)                   | Yes    |

Tools that only read carry `readOnlyHint`; `replace_product` and `remove_product_from_store`
carry `destructiveHint`, so clients can ask before running them. When the API refuses a call, the
tool returns an error with the API's message (for example `Crossmart refused (404): Product not
found`) instead of failing the session.

AI content goes through review: `generate_content` only creates pending suggestions, and
`approve_suggestion` needs a key whose role holds `suggestions:approve` (Owner, Admin or
Approver), so an agent with an Editor key can propose but never apply.

Connecting a store always needs the merchant: channel OAuth (Shopify and others) runs in the
dashboard, never through an agent.

## Adding a tool

Each tool is a spec in `apps/mcp/src/tools/*.tools.ts`: a name, a description written for the
agent, a zod input and the API call it makes (`defineTool`). Add it to the group's list; `ALL_TOOLS`
registers it. Keep one tool per endpoint and describe what the agent should read first.
