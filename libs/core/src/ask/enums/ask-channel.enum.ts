/** Where a question to Ask Crossmart came from. Stored as text in `ask_conversations.channel`. */
export enum AskChannel {
  /** The widget on crossmart.io or docs.crossmart.io. */
  WebWidget = 'web_widget',
  /** The widget inside the Crossmart web app. */
  AppWidget = 'app_widget',
  /** A direct call to `POST /api/v1/ask`. */
  Api = 'api',
  /** The MCP tool `ask_crossmart`. */
  Mcp = 'mcp',
  /** The Agent2Agent (A2A) endpoint. Set by the server, never by the caller. */
  A2a = 'a2a',
}
