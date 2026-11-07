/**
 * What an unclaimed sandbox account may not do (ADR 0019). An AI agent may build the catalog,
 * stock and drafts there; anything that reaches outside Crossmart, adds people or costs money
 * waits until the owner claims the account.
 */
export enum SandboxRestriction {
  ConnectChannel = 'connect_channel',
  Publish = 'publish',
  InviteMember = 'invite_member',
  CreateWorkspace = 'create_workspace',
  /** Crossmart's own AI content, which Crossmart pays for. */
  GenerateContent = 'generate_content',
  /** More than `SANDBOX_MAX_PRODUCTS` products. */
  AddProducts = 'add_products',
}
