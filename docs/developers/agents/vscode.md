# VS Code (GitHub Copilot agent mode)

**Status:** verified on 2026-11-06 against
[code.visualstudio.com: MCP configuration](https://code.visualstudio.com/docs/agents/reference/mcp-configuration),
[MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) and
[agent skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills).
**API key header:** supported.

## Connect

Run **MCP: Open User Configuration** (every workspace) or create `.vscode/mcp.json` (one workspace)
and add:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "crossmart-api-key",
      "description": "Crossmart API key",
      "password": true
    }
  ],
  "servers": {
    "crossmart": {
      "type": "http",
      "url": "https://mcp.crossmart.io/mcp",
      "headers": { "x-api-key": "${input:crossmart-api-key}" }
    }
  }
}
```

VS Code asks for the key the first time the server starts and stores it securely, so the file holds
no secret and can be committed.

`${input:…}` servers are not forwarded to Copilot harness sessions. There, use
`"x-api-key": "${env:CROSSMART_API_KEY}"` instead and set the variable in your environment.

VS Code is moving to a portable format (`~/.copilot/mcp-config.json`, top-level `mcpServers`,
`${CROSSMART_API_KEY}` variables); the `servers` format above still works.

## Check

**MCP: List Servers** shows **crossmart** running; in Copilot Chat's agent mode the tools picker
lists its 26 tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.copilot/skills/      # or .github/skills/ in a project
```

VS Code also reads `~/.claude/skills/` and `.claude/skills/`.
