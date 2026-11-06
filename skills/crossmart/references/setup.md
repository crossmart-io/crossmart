# Connecting Crossmart to an agent

Use this when the Crossmart tools are missing, or the seller asks how to connect Crossmart.

## What the seller needs

1. A Crossmart workspace with at least one store connected (app.crossmart.io → **Channels**).
2. An API key for the agent: **Settings → API keys → Create**. Name it after the agent ("Claude
   Code", "Cursor"…) so it is easy to revoke. Pick the smallest role that works:
   - **Viewer**: questions only.
   - **Editor**: also edit products and stock, publish to stores, generate content for review.
   - **Approver** or **Admin**: may also approve AI suggestions. Only on purpose.

The key is shown once. Tell the seller to put it **directly into the client's config or an
environment variable** (`CROSSMART_API_KEY`), not into this chat.

## The MCP server

| Setting   | Value                                                        |
| --------- | ------------------------------------------------------------ |
| URL       | `https://mcp.crossmart.io/mcp`                               |
| Transport | Streamable HTTP                                              |
| Auth      | Header `x-api-key: <key>` (or `Authorization: Bearer <key>`) |

Per-client steps (Claude Code, Cursor, VS Code, Codex, Gemini CLI, OpenClaw and more):
<https://github.com/crossmart-io/crossmart/tree/main/docs/developers/agents>.

Example (Claude Code), which the seller runs in their own terminal:

```bash
claude mcp add --transport http crossmart https://mcp.crossmart.io/mcp \
  --header "x-api-key: $CROSSMART_API_KEY"
```

Clients that only sign in with OAuth (claude.ai and ChatGPT connectors, Meta Muse) can't connect
with a key yet. Crossmart's OAuth for agents is coming; until then use a client that sends headers.

## Check the connection

Call `get_platform_health`, then `list_stores`. A `401` means the key is missing, wrong or
revoked: the seller creates a new one in the dashboard. A `403 Requires the … permission` means the
key's role is too small for that action.
