/**
 * Values of auth.md's `agent_auth` block (WorkOS). The names are the profile's v0.1.0 ones, which
 * discovery scanners read; later versions renamed some (see `AgentAuthMetadata`).
 */

/** How an agent registers: by asserting something about the user. */
export enum AgentAuthIdentityType {
  IdentityAssertion = 'identity_assertion',
}

/** What the agent asserts: the user's email, which Crossmart verifies by emailing a claim link. */
export enum AgentAuthAssertionType {
  VerifiedEmail = 'verified_email',
}

/** What the agent gets back: an API key for the new workspace. */
export enum AgentAuthCredentialType {
  ApiKey = 'api_key',
}
