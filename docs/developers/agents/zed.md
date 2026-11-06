# Zed

**Status:** verified on 2026-11-06 against [zed.dev/docs/ai/mcp](https://zed.dev/docs/ai/mcp) and
[zed.dev/docs/ai/skills](https://zed.dev/docs/ai/skills).
**API key header:** supported. Use `Authorization: Bearer`: Zed starts an OAuth sign-in for remote
servers that have no `Authorization` header, and Crossmart's OAuth is not live yet.

## Connect

**Settings → AI → MCP Servers → Add Server → Add Remote Server**, or add this to your settings file
(**zed: open settings**):

```json
{
  "context_servers": {
    "crossmart": {
      "url": "https://mcp.crossmart.io/mcp",
      "headers": { "Authorization": "Bearer cm_…" }
    }
  }
}
```

The docs don't document environment variables in `headers`, so paste the key itself.

## Check

The Agent Panel's settings show **crossmart** with a green indicator and its tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.agents/skills/       # or .agents/skills/ in a trusted project
```

Zed finds skills only directly under the skills folder, not nested deeper.
