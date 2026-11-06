# ChatGPT

**Status:** verified on 2026-11-06 against
[developers.openai.com: connect to ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt)
and [build an MCP server](https://developers.openai.com/plugins/build/mcp-server).
**API key header:** not supported. ChatGPT connects custom MCP servers with OAuth or with no
authentication, so Crossmart needs its [OAuth for agents](../README.md#oauth-for-ai-agents-coming-soon)
first.

## After OAuth (coming soon)

Custom MCP servers are added in developer mode, on plans that allow it (full read/write is for
Business and Enterprise/Edu workspaces; check
[OpenAI's help article](https://help.openai.com/en/articles/12584461) for your plan):

1. Open [chatgpt.com/plugins](https://chatgpt.com/plugins) and click **+**.
2. Choose **Add custom MCP server**.
3. Name: `Crossmart`. URL: `https://mcp.crossmart.io/mcp`.
4. Authentication: **OAuth**. Sign in to Crossmart, pick a workspace and approve the access.
5. **Create as a plugin**.

Don't choose "No authentication": the Crossmart server refuses requests without a key or token.

## Until then

Use an agent that sends headers, such as [Codex CLI](codex.md) from OpenAI, or call the
[REST API](../README.md) from your own code.

## Skills

ChatGPT has no documented `SKILL.md` support. The tool descriptions on the Crossmart server carry
the essential guidance (listing states, next steps) on their own.
