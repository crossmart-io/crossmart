# Cline

**Status:** verified on 2026-11-06 against
[docs.cline.bot: configuring MCP servers](https://docs.cline.bot/mcp/configuring-mcp-servers) and
[skills](https://docs.cline.bot/features/skills).
**API key header:** supported.

## Connect

In the extension, open **Configure → Configure MCP Servers** (the CLI uses
`~/.cline/data/settings/cline_mcp_settings.json`) and add:

```json
{
  "mcpServers": {
    "crossmart": {
      "type": "streamableHttp",
      "url": "https://mcp.crossmart.io/mcp",
      "headers": { "x-api-key": "cm_…" },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Set `"type": "streamableHttp"` explicitly: without it Cline uses the legacy SSE transport. The docs
don't document environment variables in `headers`, so paste the key itself. Keep `autoApprove`
empty, or list only read-only tools, so Cline asks before changing your catalog.

## Check

The MCP Servers view shows **crossmart** connected, with its tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.cline/skills/        # or .cline/skills/ in a project
```
