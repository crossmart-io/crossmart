# OpenClaw

**Status:** verified on 2026-11-06 against [docs.openclaw.ai/cli/mcp](https://docs.openclaw.ai/cli/mcp),
[MCP transports](https://docs.openclaw.ai/cli/mcp/transports),
[skills](https://docs.openclaw.ai/tools/skills) and the
[`openclaw mcp` source](https://github.com/openclaw/openclaw/blob/main/src/cli/mcp-cli.ts)
(release v2026.11.1). The `--header` flag is from the CLI source; the docs show headers in the
config form.
**API key header:** supported.

OpenClaw has a built-in MCP client. Saved servers live under `mcp.servers` in
`~/.openclaw/openclaw.json` (JSON5).

## Connect

With the CLI (`--header` takes `name=value` and can repeat):

```bash
openclaw mcp add crossmart \
  --url https://mcp.crossmart.io/mcp \
  --transport streamable-http \
  --header 'x-api-key=${CROSSMART_API_KEY}'
```

Or in `~/.openclaw/openclaw.json`, which you can also set with `openclaw mcp set crossmart '<json>'`:

```json5
{
  mcp: {
    servers: {
      crossmart: {
        url: 'https://mcp.crossmart.io/mcp',
        transport: 'streamable-http', // without it OpenClaw assumes SSE
        headers: { 'x-api-key': '${CROSSMART_API_KEY}' },
      },
    },
  },
}
```

OpenClaw resolves `${VAR}` in header values, so the key stays in the environment (export
`CROSSMART_API_KEY` where the gateway runs). `openclaw mcp doctor` warns about literal tokens in the
config, and header values are redacted in its output.

Keep `x-api-key` rather than `Authorization`: when a server later uses `auth: "oauth"`, OpenClaw
ignores a static `Authorization` header.

## Check

```bash
openclaw mcp probe crossmart
openclaw mcp tools crossmart
```

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
openclaw skills install /tmp/crossmart/skills/crossmart --as crossmart
```

Or copy the folder to `<workspace>/skills/` or `~/.agents/skills/`. The skill is not on ClawHub yet;
once it is, `openclaw skills install @<owner>/crossmart` installs it. OpenClaw-specific front matter
(`metadata.openclaw`) is optional and not used; see the [skill README](../../../skills/README.md).
