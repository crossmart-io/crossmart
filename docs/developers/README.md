# Crossmart for developers

Crossmart keeps one catalog and one stock ledger, and publishes them to every store a seller
connects (Shopify, eBay, Google Merchant and more). Everything the dashboard does goes through a
public REST API, so your scripts, integrations and AI agents can do it too.

- **[Quickstart](quickstart.md):** create a product, publish it to a store, override it there, and read orders, with curl and the SDK.
- **[TypeScript SDK](../../sdks/typescript/README.md):** `@crossmart/sdk`, typed from the OpenAPI spec.
- **[MCP server](mcp.md):** what AI agents can do with Crossmart, and its 26 tools.
- **[Connect your AI agent](agents/README.md):** setup guides for Claude, Cursor, VS Code, Codex,
  Gemini CLI, OpenClaw and more, plus the [Crossmart agent skill](../../skills/README.md).

## The API

|                  |                                                                                   |
| ---------------- | --------------------------------------------------------------------------------- |
| Base URL         | `https://api.crossmart.io/api/v1` (self-hosted: `http://localhost:3000/api/v1`)   |
| Interactive docs | [api.crossmart.io/api/docs](https://api.crossmart.io/api/docs)                    |
| OpenAPI spec     | [api.crossmart.io/api/docs-json](https://api.crossmart.io/api/docs-json)          |
| Format           | JSON in and out. Money is a decimal string (`"19.90"`), times are ISO 8601 in UTC |

The interactive docs list every endpoint with its fields, and let you try them with your key
(**Authorize → api_key**). Generate a client in any language from the OpenAPI spec, or use the
[TypeScript SDK](../../sdks/typescript/README.md).

### Versioning

The version is in the path: `/api/v1`. Within a version, changes are additive only: new
endpoints, new optional fields, new response fields and new enum values. Write clients that
ignore fields they don't know and tolerate new enum values. Removing or renaming anything goes
through a deprecation period and, if it can't be avoided, a new version.

> Crossmart is in early development. We avoid breaking changes, but until the first stable release
> they can still happen; they will be announced in the release notes.

## Workspaces and organizations

An **organization** is the account that holds the plan and billing. It has one or more
**workspaces**: a workspace is one business, with its own catalog, stock, stores, orders and
members. Almost every endpoint is scoped to a workspace:

```
/api/v1/workspaces/{workspaceId}/products
/api/v1/workspaces/{workspaceId}/orders
```

A workspace you can't access answers `404`, the same as one that doesn't exist, so ids don't leak.
Plan limits (active listings, connected stores, API keys…) count across the organization's
workspaces.

## Authentication

### API keys

An API key belongs to one workspace and has a role. Create one in the dashboard under
**Settings → API keys** (or with `POST /api/v1/workspaces/{workspaceId}/api-keys`). The full key
is shown once; Crossmart stores only a hash. Send it in the `x-api-key` header:

```bash
curl https://api.crossmart.io/api/v1/api-key -H "x-api-key: $CROSSMART_API_KEY"
```

`GET /api/v1/api-key` answers with the key's `workspaceId`, `role` and `permissions`, so a program
holding only the key can find its workspace.

| Role       | Typical use                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| `VIEWER`   | Read-only reporting and dashboards                                             |
| `EDITOR`   | Catalog and stock sync, publishing to stores, generating AI content for review |
| `APPROVER` | Reviewing AI suggestions                                                       |
| `ADMIN`    | Store pricing and sync rules, members and keys                                 |
| `CUSTOM`   | A role the workspace defined, with exactly the permissions you pick            |

A key can't be an Owner and never has more access than the person who created it. Each endpoint
requires one permission; a key without it gets `403 Requires the <permission> permission`. The
permissions of each role are in [docs/permissions.md](../permissions.md). Give each integration its
own key with the smallest role that works, so you can revoke it alone.

### OAuth for AI agents (coming soon)

AI agents such as Claude and ChatGPT will be able to connect through OAuth instead of a pasted
key: the seller signs in, picks a workspace and approves the access. The agent then sends an
access token as `Authorization: Bearer <token>`, limited to the scopes the seller approved and to
their own role. The SDK already accepts `{ accessToken }`.

### Sessions

The dashboard signs people in with a session cookie (Better Auth, under `/api/auth`). Use API keys
for programs; session endpoints such as `/api/v1/me` are meant for the web app.

## Errors

Errors use the HTTP status and a JSON body:

```json
{ "statusCode": 404, "error": "Not Found", "message": "Product not found" }
```

- **400**: invalid input. `message` is a list with one entry per problem:
  `["title should not be empty", "variants must contain at least 1 elements"]`.
- **401**: the key or token is missing, wrong, revoked or expired.
- **402**: the plan doesn't allow it. The body adds a machine-readable `code`
  (`plan_limit_reached` or `plan_feature_not_included`), the `feature`, the `plan`, its `limit`
  and current `usage`, so you can tell the user what to upgrade.
- **403**: the role lacks the permission.
- **404**: not found, or not in this workspace.
- **409**: conflicts with existing data, such as a duplicate SKU or handle.
- **5xx**: a server problem. Safe requests (`GET`, `PUT`, `DELETE`) can be retried with backoff.

## Pagination

List endpoints return one page at a time:

```json
{ "items": [ … ], "nextCursor": "6f1c…", "total": 137 }
```

- `limit`: page size, 1 to 100 (the default is 25 on most lists).
- `cursor`: pass the previous page's `nextCursor` to read the next page. `nextCursor` is `null` on
  the last page.
- `page`: a 1-based page number, for tables that jump between pages. It wins over `cursor`.
- `total`: how many items match the filters in all.

Unlike page numbers, cursors do not skip or repeat items when rows are added while you read. The SDK's
`listAll()` methods walk the pages for you.

## Rate limits

The `/api/v1` endpoints have no rate limit today; sign-in and sign-up under `/api/auth` do. Limits
per key may be added later, answered with `429 Too Many Requests` and a `Retry-After` header.
Handle them now (the SDK does), and batch your work: use `listAll()` with large pages, and the bulk
endpoints such as `POST …/channel-connections/{connectionId}/products/add`.

## Ask Crossmart

`POST /api/v1/ask` answers a question about Crossmart itself (features, plans, the API, SDKs,
MCP server and channels) from the public docs, and cites the pages it used. It needs no key:

```bash
curl https://api.crossmart.io/api/v1/ask -H 'content-type: application/json' \
  -d '{"question":"Can I publish one product to Shopify and eBay?"}'
```

The answer has an `outcome` (`answered`, `unknown` or `out_of_scope`), the `answer`, its
`citations` (`title`, `url`), a `confidence` and `handoff`, which is true when a person should take
over at `supportEmail`. It never sees any workspace's data. Anonymous callers may ask 5 questions a
minute and 50 a day per IP address; with an API key or a session, 20 and 500. AI agents can call it
through the MCP tool `ask_crossmart`.

## Asynchronous work

Talking to marketplaces takes time and can fail, so changes that reach a store run in the
background. The API records the change and answers at once; a worker then publishes it. Publishing
a product creates a listing with status `PENDING`, which becomes `ACTIVE` when the store accepts it
or `ERROR` (with the store's message in `lastError`) when it refuses. The
[quickstart](quickstart.md#check-the-listing-status) shows how to follow it.

## Where to go next

- [Quickstart](quickstart.md)
- [TypeScript SDK](../../sdks/typescript/README.md)
- [MCP server for AI agents](mcp.md) and [setup per agent](agents/README.md)
- [Roles and permissions](../permissions.md)
- [Architecture](../architecture.md), for contributors
