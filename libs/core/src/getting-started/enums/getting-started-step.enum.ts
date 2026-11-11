/** The steps from a new account to a first listing on a store. */
export enum GettingStartedStep {
  /** Confirm the email address the account was opened with. */
  VerifyEmail = 'verify_email',
  /** Claim an account an AI agent opened (a sandbox, ADR 0019). */
  ClaimAccount = 'claim_account',
  /** Put products in the catalog: by hand, by an agent, or imported from a store. */
  AddProducts = 'add_products',
  /** Approve or reject outside agents' changes waiting for the seller (ADR 0028). */
  ReviewProposals = 'review_proposals',
  /** Connect a store on a channel, such as Shopify or eBay. */
  ConnectStore = 'connect_store',
  /** List a product on a connected store. */
  Publish = 'publish',
}
