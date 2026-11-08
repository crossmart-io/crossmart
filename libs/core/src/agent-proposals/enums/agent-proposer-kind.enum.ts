/** Which credential proposed a change (ADR 0028). Stored as text; part of the API. */
export enum AgentProposerKind {
  /** A connected agent with an OAuth access token, such as Claude or ChatGPT. */
  OAuthAgent = 'oauth_agent',
  /** An MCP session that carries a workspace API key. */
  ApiKey = 'api_key',
}
