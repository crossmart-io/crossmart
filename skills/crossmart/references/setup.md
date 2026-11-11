# Connecting Crossmart to an agent

Use this when the Crossmart tools are missing, or the seller asks how to connect Crossmart.

## What the seller needs

A Crossmart workspace with at least one store connected (app.crossmart.io → **Stores**). Then
they connect the agent in one of two ways: sign in with OAuth (simplest), or an API key.

## The MCP server

| Setting   | Value                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| URL       | `https://mcp.crossmart.io/mcp`                                                 |
| Transport | Streamable HTTP                                                                |
| Auth      | OAuth sign-in, or header `x-api-key: <key>` (or `Authorization: Bearer <key>`) |

Per-client steps (Claude Code, claude.ai, ChatGPT, Cursor, VS Code, Codex, Gemini CLI, OpenClaw
and more): <https://docs.crossmart.io/agents/>.

## Sign in with OAuth

The seller adds the server without a key and signs in to Crossmart in the browser. Example
(Claude Code), which the seller runs in their own terminal:

```bash
claude mcp add --transport http crossmart https://mcp.crossmart.io/mcp
```

Then, in a Claude Code session, they run `/mcp`, choose **crossmart** and **Authenticate**. In
other clients (claude.ai and ChatGPT connectors, Cursor, VS Code…) they add the remote server URL
`https://mcp.crossmart.io/mcp` and sign in when the client asks.

In the browser they sign in, choose the **workspace** the agent works in, and approve either
everything the agent asks for or **read only**. The agent then works in that one workspace, never
with more than the seller's own role allows, and never manages members, API keys, store
connections, settings or billing. Agents are listed and disconnected under **Settings → Developers →
Connected agents**.

## Or use an API key

For clients that only send headers, or for scripts: **Settings → Developers → API keys → Create key**. Name the key
after the agent ("Claude Code", "Cursor"…) so it is easy to revoke. Pick the smallest role that
works:

- **Viewer**: questions only.
- **Editor**: also edit products and stock, publish to stores, generate content for review.
- **Approver** or **Admin**: may also approve AI suggestions. Only on purpose.

The key is shown once. Tell the seller to put it **directly into the client's config or an
environment variable** (`CROSSMART_API_KEY`), not into this chat. Example (Claude Code):

```bash
claude mcp add --transport http crossmart https://mcp.crossmart.io/mcp \
  --header "x-api-key: $CROSSMART_API_KEY"
```

## Check the connection

Call `get_platform_health`, then `list_stores`. A `401` means the sign-in expired or was
disconnected (the seller authenticates again), or the key is missing, wrong or revoked (the seller
creates a new one in the dashboard). A `403 Requires the … permission` means the role, or a
read-only sign-in, is too small for that action.
