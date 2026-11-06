# Claude Code

**Status:** verified on 2026-11-06 against [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)
and [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills).
**API key header:** supported.

Before you start, create an API key ([how](README.md#before-you-start)) and export it in your shell:

```bash
export CROSSMART_API_KEY="cm_…"
```

## Connect

```bash
claude mcp add --transport http crossmart https://mcp.crossmart.io/mcp \
  --header "x-api-key: $CROSSMART_API_KEY"
```

`--scope user` makes it available in every project; the default (`local`) keeps it to the current
project. Both store the key in `~/.claude.json`.

To share the server with a team without sharing a key, commit a `.mcp.json` at the repository root.
Claude Code expands `${VAR}` in `url` and `headers`, so each person's own environment supplies it:

```json
{
  "mcpServers": {
    "crossmart": {
      "type": "http",
      "url": "https://mcp.crossmart.io/mcp",
      "headers": { "x-api-key": "${CROSSMART_API_KEY}" }
    }
  }
}
```

Use the name `CROSSMART_API_KEY`: Claude Code leaves some well-known credential variables (such as
`ANTHROPIC_API_KEY`) empty in remote headers.

## Check

```bash
claude mcp list          # crossmart … ✓ Connected
```

In a session, `/mcp` lists the server and its 26 tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.claude/skills/     # or .claude/skills/ in a project
```

Claude loads it when a request matches, or run `/crossmart`.
