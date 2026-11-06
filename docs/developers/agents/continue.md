# Continue

**Status:** unverified. [docs.continue.dev](https://docs.continue.dev/customize/deep-dives/mcp)
documents remote servers (`type: streamable-http`, `url`) and a `requestOptions` block for them
whose [reference](https://docs.continue.dev/reference) includes `headers`, but shows no MCP example
with headers. The config below follows the reference; it has not been confirmed.
**API key header:** probably, through `requestOptions.headers`.

## Connect

Add to `~/.continue/config.yaml`, or create a block file in `.continue/mcpServers/` (a block file
also needs top-level `name`, `version` and `schema`):

```yaml
mcpServers:
  - name: Crossmart
    type: streamable-http
    url: https://mcp.crossmart.io/mcp
    requestOptions:
      headers:
        x-api-key: cm_…
```

Continue documents `${{ secrets.NAME }}` only inside `env`, so whether it works in headers is also
unconfirmed. If the server answers `401`, the header is not being sent; please
[open an issue](https://github.com/crossmart-io/crossmart/issues) with your Continue version.

## Check

The MCP section of Continue's settings lists **Crossmart** and its tools in agent mode.

## Skills

Continue has no documented `SKILL.md` support. Its closest feature is rules in `.continue/rules`;
you can copy the safety rules from [`SKILL.md`](../../../skills/crossmart/SKILL.md) into one.
