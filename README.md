<div align="center">

# crossmart

**The open-source multichannel platform for sellers and their AI agents.**

Manage listings, inventory and orders across Amazon, eBay, Shopify, Etsy and more,
from one dashboard or straight from Claude & ChatGPT.

[Website](https://crossmart.io) · [Docs](https://docs.crossmart.io) · [Architecture](docs/architecture.md)

</div>

> [!WARNING]
> Crossmart is in early development. APIs and data models will change, and it is not ready for production use yet.

## Why Crossmart

- **One catalog, every marketplace.** Create or import products once, then publish tailored listings to every channel.
- **AI does the busywork.** Agents write channel-specific content, map categories and attributes, and fix marketplace rejections. You review and approve.
- **Built for agents.** Everything in the dashboard is available through a REST API and an MCP server, so your own AI agent can run your catalog.
- **No overselling.** A single inventory ledger with real-time order ingestion and last-unit protection keeps every channel in sync.
- **Open source.** Self-host it for free, or use [Crossmart Cloud](https://crossmart.io) and skip marketplace app approvals.

## Repository layout

| Path              | What it is                                                |
| ----------------- | --------------------------------------------------------- |
| `apps/api`        | REST API (NestJS)                                         |
| `apps/worker`     | Background jobs: channel sync, orders, AI agents (BullMQ) |
| `apps/mcp`        | MCP server that exposes the API to AI agents              |
| `libs/common`     | Configuration, constants and shared utilities             |
| `libs/database`   | Prisma schema, migrations and client                      |
| `libs/connectors` | Marketplace connector SDK and connectors                  |

The web app lives in [crossmart-io/crossmart-web](https://github.com/crossmart-io/crossmart-web).

## Quick start (development)

Requirements: Node.js 22+ (see `.nvmrc`), pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis   # set POSTGRES_PORT / REDIS_PORT if 5432 / 6379 are taken
pnpm db:migrate
pnpm start:api                        # http://localhost:3000/api/docs
pnpm start:worker
```

## Self-hosting

```bash
docker compose --profile app up -d --build
```

This starts PostgreSQL, Redis, applies migrations, and runs the API and worker.

## Using Crossmart from Claude, ChatGPT or Cursor

Build the MCP server and register it with your client:

```bash
pnpm build:mcp
```

```json
{
  "mcpServers": {
    "crossmart": {
      "command": "node",
      "args": ["/path/to/crossmart/dist/apps/mcp/main.js"],
      "env": { "CROSSMART_API_URL": "http://localhost:3000" }
    }
  }
}
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. It covers the code standards, the commit format and the Contributor License Agreement.

## License

Crossmart is licensed under the [GNU Affero General Public License v3.0](LICENSE).
"Crossmart" and the Crossmart logo are trademarks of their owner and are not covered by the code license.
