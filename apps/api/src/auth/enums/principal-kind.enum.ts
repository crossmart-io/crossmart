export enum PrincipalKind {
  User = 'user',
  ApiKey = 'api-key',
  /** An AI agent connected with OAuth, acting for a user in one workspace. */
  Agent = 'agent',
  /** Agent Worker (ADR 0026), the built-in agent, calling the API for the person it chats with. */
  AgentWorker = 'agent-worker',
}
