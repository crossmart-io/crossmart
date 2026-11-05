/**
 * What a plan grants: limits that are counted, and flags that are on or off (`FEATURE_KINDS`).
 * Stored as text in `plan_features.feature`, so a new feature needs no enum migration. The
 * migration that adds one must still give it a row in every plan version: a feature a version
 * does not list is not included, which is how grandfathered customers would otherwise read it.
 */
export enum Feature {
  /** Listings live on a channel (`ListingStatus.ACTIVE`), across the organization. */
  ActiveListings = 'active_listings',
  /** Channel accounts that are not disconnected, across the organization. */
  ChannelConnections = 'channel_connections',
  Workspaces = 'workspaces',
  /** People in at least one workspace of the organization, each counted once. */
  Members = 'members',
  /** API keys that are neither revoked nor expired, across the organization. */
  ApiKeys = 'api_keys',
  /** AI credits per month. Metered by the AI usage records once they exist. */
  AiCredits = 'ai_credits',
  /** Agents that act on their own instead of asking for approval. */
  AutonomousAgents = 'autonomous_agents',
  /** Using the merchant's own AI provider key instead of Crossmart's. */
  BringYourOwnKey = 'bring_your_own_key',
}
