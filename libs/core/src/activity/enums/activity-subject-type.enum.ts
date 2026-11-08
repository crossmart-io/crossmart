/** The kind of record an activity event is about. Stored as text, like `ActivityAction`. */
export enum ActivitySubjectType {
  Product = 'product',
  ProductView = 'product_view',
  /** An entry of the import history; the event links to it. */
  ImportJob = 'import_job',
  ApiKey = 'api_key',
  /** An AI agent connected with OAuth; the id is the connection (consent) id. */
  AgentConnection = 'agent_connection',
  /** A workspace member; the id is their user id. */
  Member = 'member',
  Invitation = 'invitation',
  Workspace = 'workspace',
  /** An outside agent's proposed change (ADR 0028). */
  AgentProposal = 'agent_proposal',
  /** A role the workspace defined itself. */
  CustomRole = 'custom_role',
  ChannelConnection = 'channel_connection',
  /** A URL the workspace receives webhook events at. */
  WebhookEndpoint = 'webhook_endpoint',
}
