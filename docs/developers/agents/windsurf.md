# Windsurf (Devin Desktop)

**Status:** verified on 2026-11-06 against [docs.devin.ai: Cascade MCP](https://docs.devin.ai/desktop/cascade/mcp),
[MCP configuration](https://docs.devin.ai/cli/extensibility/mcp/configuration.md) and
[Cascade skills](https://docs.devin.ai/desktop/cascade/skills). Windsurf's docs now redirect to
Devin's; the older `~/.codeium/windsurf/mcp_config.json` file and `serverUrl` field are not in the
current official docs.
**API key header:** supported.

## Connect

Add the server to `~/.config/devin/mcp_config.json` (user) or `.devin/mcp_config.json` (project;
use `.devin/mcp_config.local.json` to keep the key out of git):

```json
{
  "mcpServers": {
    "crossmart": {
      "url": "https://mcp.crossmart.io/mcp",
      "transport": "http",
      "headers": { "x-api-key": "cm_…" }
    }
  }
}
```

The docs document `${env:VAR}` only for OAuth fields, so paste the key itself here and keep the file
private.

## Check

Open Cascade's MCP panel and refresh: **crossmart** lists its 26 tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.config/devin/skills/   # or .devin/skills/ in a project
```

It also reads `~/.agents/skills/` and the legacy `.windsurf/skills/`.
