/** How an agent's OAuth client became known to Crossmart, which decides what can be trusted. */
export enum AgentClientRegistration {
  /**
   * Its client id is the HTTPS address of a Client ID Metadata Document that Crossmart fetched,
   * so its name and site come from that host.
   */
  MetadataDocument = 'metadata_document',
  /**
   * It registered itself (Dynamic Client Registration): it chose its own name and site, and
   * nothing checked them. Any client can call itself "Claude".
   */
  Dynamic = 'dynamic',
}
