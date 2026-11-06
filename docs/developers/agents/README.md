# Connect your AI agent

Crossmart works with any agent that speaks the [Model Context Protocol](https://modelcontextprotocol.io).
Pick yours below. Each guide shows where the config goes, how to send your API key, and how to install
the [Crossmart skill](../../../skills/README.md), which teaches the agent the seller workflows.

|                |                                                                       |
| -------------- | --------------------------------------------------------------------- |
| Server URL     | `https://mcp.crossmart.io/mcp` (Streamable HTTP)                      |
| Authentication | Header `x-api-key: <key>`, or `Authorization: Bearer <key>`           |
| Tools          | 25: products, stock, stores, listings, eBay, orders, reports, content |

## Before you start

1. Connect your stores in the dashboard (**Channels**). Agents can't connect stores.
2. Create an API key: **Settings → API keys → Create**. Name it after the agent, and pick the smallest
   role that works (**Viewer** to ask questions, **Editor** to change the catalog and publish). See
   [roles](../README.md#api-keys).
3. Put the key in the agent's config or in an environment variable (`CROSSMART_API_KEY`). Never paste
   it into a chat.

## Platforms

"Verified" means the config was checked against the platform's official documentation on
2026-11-06 (the source is linked at the top of each guide). "Unverified" means the official docs
don't confirm every detail; the guide says which.

| Agent                                   | API key header                  | Skill          | Status                                                                                       |
| --------------------------------------- | ------------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| [Claude Code](claude-code.md)           | Yes                             | Yes            | Verified ([docs](https://code.claude.com/docs/en/mcp))                                       |
| [Claude Desktop](claude-desktop.md)     | Through a local bridge          | Upload (zip)   | Verified ([docs](https://modelcontextprotocol.io/docs/develop/connect-local-servers))        |
| [claude.ai connectors](claude-ai.md)    | Beta orgs only; otherwise OAuth | Upload (zip)   | Verified ([docs](https://claude.com/docs/connectors/custom/add-unlisted))                    |
| [ChatGPT](chatgpt.md)                   | No: use OAuth                   | No             | Verified ([docs](https://developers.openai.com/plugins/deploy/connect-chatgpt))              |
| [Cursor](cursor.md)                     | Yes                             | Yes            | Verified ([docs](https://cursor.com/docs/context/mcp))                                       |
| [Windsurf (Devin Desktop)](windsurf.md) | Yes                             | Yes            | Verified ([docs](https://docs.devin.ai/desktop/cascade/mcp))                                 |
| [VS Code (GitHub Copilot)](vscode.md)   | Yes                             | Yes            | Verified ([docs](https://code.visualstudio.com/docs/agents/reference/mcp-configuration))     |
| [Zed](zed.md)                           | Yes (`Authorization: Bearer`)   | Yes            | Verified ([docs](https://zed.dev/docs/ai/mcp))                                               |
| [Cline](cline.md)                       | Yes                             | Yes            | Verified ([docs](https://docs.cline.bot/mcp/configuring-mcp-servers))                        |
| [Continue](continue.md)                 | Probably                        | No             | Unverified (headers not shown in [docs](https://docs.continue.dev/customize/deep-dives/mcp)) |
| [OpenAI Codex CLI](codex.md)            | Yes                             | Yes            | Verified ([docs](https://learn.chatgpt.com/docs/extend/mcp?surface=cli))                     |
| [Gemini CLI](gemini-cli.md)             | Yes                             | Yes            | Verified ([docs](https://geminicli.com/docs/tools/mcp-server/))                              |
| [OpenClaw](openclaw.md)                 | Yes                             | Yes            | Verified ([docs](https://docs.openclaw.ai/cli/mcp/transports))                               |
| [Meta Muse](meta-muse.md)               | Not documented: use OAuth       | Not documented | Unverified (no official MCP docs)                                                            |
| [Goose](goose.md)                       | Yes (`goose configure`)         | Yes            | Unverified (headers confirmed in [source](https://github.com/aaif-goose/goose), not in docs) |
| [Hermes Agent](hermes-agent.md)         | Yes                             | Yes            | Verified ([docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp))        |

**OAuth:** ChatGPT, Meta Muse, claude.ai and Claude Desktop connectors sign in with Crossmart's
[OAuth for agents](../README.md#oauth-for-ai-agents): add the URL, sign in, pick a workspace and
approve the access. Clients that send headers can use either OAuth or an API key.

## Config at a glance

Replace `cm_…` with your key, or keep the variable form where the client expands it.

| Agent        | File                              | Entry                                                                                                                     |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Claude Code  | `.mcp.json`                       | `"crossmart": { "type": "http", "url": "…/mcp", "headers": { "x-api-key": "${CROSSMART_API_KEY}" } }`                     |
| Cursor       | `~/.cursor/mcp.json`              | `"crossmart": { "url": "…/mcp", "headers": { "x-api-key": "${env:CROSSMART_API_KEY}" } }`                                 |
| Windsurf     | `~/.config/devin/mcp_config.json` | `"crossmart": { "url": "…/mcp", "transport": "http", "headers": { "x-api-key": "cm_…" } }`                                |
| VS Code      | `.vscode/mcp.json`                | `"servers": { "crossmart": { "type": "http", "url": "…/mcp", "headers": { "x-api-key": "${input:…}" } } }`                |
| Zed          | Zed settings                      | `"context_servers": { "crossmart": { "url": "…/mcp", "headers": { "Authorization": "Bearer cm_…" } } }`                   |
| Cline        | `cline_mcp_settings.json`         | `"crossmart": { "type": "streamableHttp", "url": "…/mcp", "headers": { "x-api-key": "cm_…" } }`                           |
| Codex CLI    | `~/.codex/config.toml`            | `[mcp_servers.crossmart]` `url = "…/mcp"` `env_http_headers = { "x-api-key" = "CROSSMART_API_KEY" }`                      |
| Gemini CLI   | `~/.gemini/settings.json`         | `"crossmart": { "httpUrl": "…/mcp", "headers": { "x-api-key": "${CROSSMART_API_KEY}" } }`                                 |
| OpenClaw     | `~/.openclaw/openclaw.json`       | `mcp.servers.crossmart: { url: "…/mcp", transport: "streamable-http", headers: { "x-api-key": "${CROSSMART_API_KEY}" } }` |
| Goose        | `~/.config/goose/config.yaml`     | `type: streamable_http`, `uri: …/mcp`, `headers: { x-api-key: cm_… }`                                                     |
| Hermes Agent | `~/.hermes/config.yaml`           | `mcp_servers.crossmart: { url: "…/mcp", headers: { x-api-key: "${CROSSMART_API_KEY}" } }`                                 |

`…/mcp` is `https://mcp.crossmart.io/mcp`. A self-hosted server answers at `http://localhost:3100/mcp`
(see [self-hosting](../mcp.md#self-hosting)).

## Something not working?

- **The server won't connect (HTTP 401):** the client sent no key. Check the header name and that
  the environment variable is set where the client runs.
- **Tools answer `Crossmart refused (401)`:** the key is wrong or revoked. Create a new one.
- **403 Requires the … permission:** the key's role is too small for that tool.
- **The client asks you to sign in:** it found no `Authorization` header and started OAuth. Sign
  in to Crossmart and approve the access, or send the key as `Authorization: Bearer <key>`
  instead (see [Zed](zed.md)).
- A platform not listed here: any client that can send a header to a Streamable HTTP server works.
  [Open an issue](https://github.com/crossmart-io/crossmart/issues) and we'll add a guide.
