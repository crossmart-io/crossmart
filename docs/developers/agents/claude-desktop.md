# Claude Desktop

**Status:** verified on 2026-11-06 against
[modelcontextprotocol.io: connect local servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers),
[claude.com: custom connectors](https://claude.com/docs/connectors/custom/add-unlisted) and the
[mcp-remote README](https://github.com/geelen/mcp-remote).
**API key header:** not for remote servers in `claude_desktop_config.json`. Use a local bridge (below).

Claude Desktop adds **remote** servers as custom connectors, which sign in with OAuth (see
[claude.ai](claude-ai.md)). Its config file starts **local** (stdio) servers only. Until Crossmart's
OAuth is live, run a local server that holds the key.

The config file opens from **Settings → Developer → Edit Config**:

| OS      | Path                                                              |
| ------- | ----------------------------------------------------------------- |
| macOS   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| Linux   | `~/.config/Claude/claude_desktop_config.json`                     |

## Option A: the `mcp-remote` bridge

[`mcp-remote`](https://github.com/geelen/mcp-remote) is a small open-source stdio proxy that
forwards to a remote server and adds headers. It needs Node.js. It is a third-party project, not
part of Claude or Crossmart; pin a version you've reviewed if your security policy asks for it.

```json
{
  "mcpServers": {
    "crossmart": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.crossmart.io/mcp",
        "--header",
        "x-api-key:${CROSSMART_API_KEY}"
      ],
      "env": { "CROSSMART_API_KEY": "cm_…" }
    }
  }
}
```

Write `x-api-key:${CROSSMART_API_KEY}` without a space after the colon: the mcp-remote README notes
that Claude Desktop on Windows does not escape spaces inside `args`.

## Option B: Crossmart's own local server

Build the server from this repository and let Claude Desktop start it; see
[MCP server → Claude Desktop](../mcp.md#claude-desktop-local-server).

## Check

Restart Claude Desktop. The tools menu in a new chat lists **crossmart** with its 26 tools.

## Install the skill

Zip the [`skills/crossmart`](../../../skills/crossmart) folder (the zip must contain the
`crossmart` folder with `SKILL.md` inside), then **Customize → Skills → + → Upload a skill**. Skills
need code execution turned on (**Settings → Capabilities**). See
[Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude).
