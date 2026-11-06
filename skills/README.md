# Crossmart agent skills

[`crossmart/`](crossmart) is an [Agent Skill](https://agentskills.io): a folder with a `SKILL.md`
that teaches an AI agent the seller workflows on top of the
[Crossmart MCP server](../docs/developers/mcp.md): connect a store and check readiness, add and
publish products, read listing states and fix `needs_details`, retry failed listings, eBay
categories and item specifics, stock adjustments, orders, and the safety rules (confirm bulk and
destructive actions, never ask for marketplace passwords, keep API keys out of chat).

```
skills/crossmart/
├── SKILL.md                         # short entry point: rules and a workflow index
└── references/                      # loaded only when a workflow needs it
    ├── setup.md                     # connecting the MCP server, API keys
    ├── stores.md                    # store connection and publish readiness
    ├── products-and-publishing.md   # create, edit, publish, remove, AI content
    ├── listing-states.md            # displayState, displayRequirement, retry
    ├── ebay.md                      # categories and item specifics
    ├── stock.md                     # adjust_stock
    ├── orders-and-reports.md        # orders, sales and inventory reports
    └── rest-api.md                  # REST fallback, tool → endpoint map
```

The skill needs the MCP server connected; set that up first with the guide for your agent in
[docs/developers/agents](../docs/developers/agents/README.md).

## Install

Every platform below reads the same folder. Get it once:

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart.git /tmp/crossmart
```

| Platform                         | Install                                                                                                         | Source                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Any agent the `skills` CLI knows | `npx skills add crossmart-io/crossmart --skill crossmart` (add `-g` for all projects, `-a <agent>` to pick one) | [vercel-labs/skills](https://github.com/vercel-labs/skills)                                    |
| Claude Code                      | `cp -R /tmp/crossmart/skills/crossmart ~/.claude/skills/` (or `.claude/skills/` in a project)                   | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)                       |
| claude.ai and Claude Desktop     | Zip the `crossmart` folder, then **Customize → Skills → + → Upload a skill**. Needs code execution turned on.   | [support.claude.com](https://support.claude.com/en/articles/12512180-using-skills-in-claude)   |
| OpenClaw                         | `openclaw skills install /tmp/crossmart/skills/crossmart --as crossmart`                                        | [docs.openclaw.ai/tools/skills](https://docs.openclaw.ai/tools/skills)                         |
| OpenAI Codex, Goose, Zed         | `cp -R /tmp/crossmart/skills/crossmart ~/.agents/skills/`                                                       | see each [agent guide](../docs/developers/agents/README.md)                                    |
| Gemini CLI                       | `gemini skills install https://github.com/crossmart-io/crossmart.git --path skills/crossmart --scope user`      | [geminicli.com/docs/cli/skills](https://geminicli.com/docs/cli/skills/)                        |
| Cursor                           | `cp -R /tmp/crossmart/skills/crossmart ~/.cursor/skills/` (it also reads `~/.agents/skills/`)                   | [cursor.com/docs/context/skills](https://cursor.com/docs/context/skills)                       |
| VS Code (GitHub Copilot)         | `cp -R /tmp/crossmart/skills/crossmart ~/.copilot/skills/` (or `.github/skills/` in a project)                  | [code.visualstudio.com](https://code.visualstudio.com/docs/copilot/customization/agent-skills) |
| Windsurf (Devin Desktop)         | `cp -R /tmp/crossmart/skills/crossmart ~/.config/devin/skills/`                                                 | [docs.devin.ai](https://docs.devin.ai/desktop/cascade/skills)                                  |
| Cline                            | `cp -R /tmp/crossmart/skills/crossmart ~/.cline/skills/`                                                        | [docs.cline.bot](https://docs.cline.bot/features/skills)                                       |
| Hermes Agent                     | `hermes skills install crossmart-io/crossmart/skills/crossmart`                                                 | [hermes-agent docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)     |
| Continue, ChatGPT, Meta Muse     | No documented `SKILL.md` support. The MCP tool descriptions still guide the agent.                              |                                                                                                |

`npx skills add` and `hermes skills install` read the public GitHub repository, so they work once
the skill is on `main`.

## Front matter and platform differences

`SKILL.md` uses only the fields of the [Agent Skills specification](https://agentskills.io/specification),
so every consumer accepts it:

| Field           | Value                                      | Rule it meets                                                                             |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `name`          | `crossmart`                                | 1–64 chars, `a-z0-9-`, matches the folder name; no reserved words (`claude`, `anthropic`) |
| `description`   | What it does and when to use it            | 1–1024 chars, no XML tags                                                                 |
| `license`       | `AGPL-3.0-only`                            | Optional; the repository's license                                                        |
| `compatibility` | Needs the MCP server or network access     | Optional, ≤ 500 chars                                                                     |
| `metadata`      | `homepage`, `source`, `version` as strings | Optional string-to-string map                                                             |

- **Claude** (claude.ai, Desktop, API) rejects unknown front matter keys, and `name` must not
  contain `claude` or `anthropic`. The upload fails when the zip has no `SKILL.md` or the folder
  name differs from `name`.
- **OpenClaw** can gate a skill on `metadata.openclaw.requires.env` and link an API key with
  `primaryEnv`. We leave them out: they are nested objects, which the spec's string map does not
  allow, and the skill works through the MCP server without an environment variable.
- **Hermes** adds optional `metadata.hermes` fields; none are needed.
- **Zed** only finds skills directly under its skills folder (no nesting).
- `SKILL.md` stays short (well under the 500-line guidance); details load from `references/` on
  demand, one level deep.

## Publishing (maintainers)

Nothing is published yet. When the skill is on `main`:

### skills.sh

There is no submission step: skills.sh lists a skill automatically from the anonymous install
telemetry of `npx skills add` on public repositories
([skills.sh/docs/faq](https://skills.sh/docs/faq)).

1. Merge this folder to `main` of the public `crossmart-io/crossmart` repository.
2. Check it is discoverable: `npx skills add crossmart-io/crossmart --list` shows `crossmart`.
3. Install it once: `npx skills add crossmart-io/crossmart --skill crossmart`. The listing appears
   on skills.sh after installs are counted.
4. Link the skills.sh page from the docs and the README once it exists.

### ClawHub (OpenClaw)

> **Licence decision first.** ClawHub releases every published skill under **MIT-0**
> ([clawhub docs/cli.md](https://github.com/openclaw/clawhub/blob/main/docs/cli.md)); there is no
> per-skill licence. The repository is AGPL-3.0, so publishing there means the owner (the LLC)
> deliberately licenses this folder under MIT-0 too, and changes `license:` in `SKILL.md` to match.

Requirements: a GitHub account at least 14 days old, and semver versions.

```bash
npm i -g clawhub
clawhub login                                    # device flow in the browser
clawhub skill publish ./skills/crossmart --dry-run
clawhub skill publish ./skills/crossmart \
  --slug crossmart --name "Crossmart" \
  --version 1.0.0 --changelog "Initial release" --tags latest
```

Add `--owner <org-handle>` to publish under an organisation. Afterwards, sellers install it with
`openclaw skills install @<owner>/crossmart`. Bump `metadata.version` in `SKILL.md` with each
release and publish the same version.
