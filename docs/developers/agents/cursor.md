# Cursor

**Status:** verified on 2026-11-06 against [cursor.com/docs/context/mcp](https://cursor.com/docs/context/mcp)
and [cursor.com/docs/context/skills](https://cursor.com/docs/context/skills).
**API key header:** supported.

## Connect

Add the server to `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one project):

```json
{
  "mcpServers": {
    "crossmart": {
      "url": "https://mcp.crossmart.io/mcp",
      "headers": { "x-api-key": "${env:CROSSMART_API_KEY}" }
    }
  }
}
```

Cursor resolves `${env:NAME}` in `url` and `headers`. Set `CROSSMART_API_KEY` in your shell profile
or system environment (an `envFile` does not apply to remote servers), then restart Cursor. You can
also paste the key in place of `${env:…}`, but then don't commit the file.

## Check

**Cursor Settings → MCP** shows **crossmart** with a green dot and its tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.cursor/skills/      # or .cursor/skills/ in a project
```

Cursor also reads `~/.agents/skills/` and `~/.claude/skills/`.
