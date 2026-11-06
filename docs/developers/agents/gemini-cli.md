# Gemini CLI

**Status:** verified on 2026-11-06 against
[geminicli.com: MCP servers](https://geminicli.com/docs/tools/mcp-server/),
[configuration](https://geminicli.com/docs/reference/configuration/) and
[skills](https://geminicli.com/docs/cli/skills/).
**API key header:** supported.

Google moved unpaid-tier and Google One users from Gemini CLI to Antigravity CLI on 2026-06-18; this
page covers Gemini CLI.

## Connect

Add to `~/.gemini/settings.json` (user) or `.gemini/settings.json` (project):

```json
{
  "mcpServers": {
    "crossmart": {
      "httpUrl": "https://mcp.crossmart.io/mcp",
      "headers": { "x-api-key": "${CROSSMART_API_KEY}" }
    }
  }
}
```

Use `httpUrl` (Streamable HTTP), not `url` (SSE). Gemini CLI expands `${VAR}` in settings, so export
`CROSSMART_API_KEY` in your shell and the file holds no secret.

The CLI form writes the key itself into the file:

```bash
gemini mcp add --transport http --header "x-api-key: $CROSSMART_API_KEY" -s user \
  crossmart https://mcp.crossmart.io/mcp
```

## Check

```bash
gemini mcp list
```

In a session, `/mcp` shows **crossmart** and its tools.

## Install the skill

```bash
gemini skills install https://github.com/crossmart-io/crossmart.git --path skills/crossmart --scope user
```

Or copy [`skills/crossmart`](../../../skills/crossmart) to `~/.gemini/skills/` or `~/.agents/skills/`.
`/skills list` confirms it.
