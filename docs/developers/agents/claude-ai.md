# claude.ai custom connectors

**Status:** verified on 2026-11-06 against
[claude.com: add a custom connector](https://claude.com/docs/connectors/custom/add-unlisted),
[connector authentication](https://claude.com/docs/connectors/building/authentication) and
[support.claude.com](https://support.claude.com/en/articles/11175166).
**API key header:** only for organisations in Anthropic's request-headers beta. Everyone else needs
OAuth, which is [coming soon](../README.md#oauth-for-ai-agents-coming-soon).

Custom connectors are shared by claude.ai, Claude Desktop and the mobile apps.

## Today: request headers (beta, some organisations)

If your organisation has the beta, the connector dialog shows a **Request headers** section:

1. Pro, Max and Ultra: **Customize → Connectors → Add custom connector**. Team and Enterprise: an
   Owner opens **Organization settings → Connectors → Add → Custom → Web**.
2. Name: `Crossmart`. URL: `https://mcp.crossmart.io/mcp`.
3. Authentication: **No sign-in**.
4. Under **Request headers**, add `x-api-key` with your key as the value. `x-api-key` is one of the
   pre-approved header names.

The key is shared by everyone in the organisation who uses the connector, so create it with the
smallest role that works (usually **Viewer** or **Editor**). Authentication settings can't be
edited later; remove the connector and add it again to change the key.

If you don't see **Request headers**, your organisation is not in the beta: use
[Claude Desktop](claude-desktop.md) with a local bridge, or [Claude Code](claude-code.md), until
OAuth is live.

## After OAuth (coming soon)

Add the connector with the URL only and choose **Sign in**. You'll sign in to Crossmart, pick a
workspace and approve what Claude may do. No key is pasted.

## Install the skill

Zip the [`skills/crossmart`](../../../skills/crossmart) folder and upload it under
**Customize → Skills → + → Upload a skill** (code execution must be on). See
[Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude).
