/** Who asked. Stored as text in `ask_conversations.caller_type`. */
export enum AskCallerType {
  Anonymous = 'anonymous',
  /** A signed-in person (a session). */
  User = 'user',
  /** A workspace API key. */
  ApiKey = 'api_key',
  /** An AI agent with an OAuth access token (ADR 0019). */
  Agent = 'agent',
}
