# OpenAI Codex CLI

**Status:** verified on 2026-11-06 against
[Codex docs: MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli),
[build skills](https://learn.chatgpt.com/docs/build-skills) and the
[`codex mcp` source](https://github.com/openai/codex/blob/main/codex-rs/cli/src/mcp_cmd.rs).
**API key header:** supported.

## Connect

Add to `~/.codex/config.toml` (or `.codex/config.toml` in a trusted project):

```toml
[mcp_servers.crossmart]
url = "https://mcp.crossmart.io/mcp"
env_http_headers = { "x-api-key" = "CROSSMART_API_KEY" }
```

`env_http_headers` maps a header to the **name** of an environment variable, so the key stays out of
the file. Export it before starting Codex:

```bash
export CROSSMART_API_KEY="cm_…"
```

Alternatives: `http_headers = { "x-api-key" = "cm_…" }` holds the key itself, and
`bearer_token_env_var = "CROSSMART_API_KEY"` sends it as `Authorization: Bearer`. The CLI form
uses the bearer variant:

```bash
codex mcp add crossmart --url https://mcp.crossmart.io/mcp --bearer-token-env-var CROSSMART_API_KEY
```

## Check

```bash
codex mcp list
```

In a session, `/mcp` lists **crossmart** and its tools.

## Install the skill

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
cp -R /tmp/crossmart/skills/crossmart ~/.agents/skills/       # or .agents/skills/ in a repository
```
