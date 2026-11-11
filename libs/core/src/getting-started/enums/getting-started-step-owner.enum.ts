/** Who can take a step: the seller in the Crossmart app, or an agent with its tools. */
export enum GettingStartedStepOwner {
  /** Only the seller, in the Crossmart app or their inbox; an agent can only point them there. */
  Merchant = 'merchant',
  /** An agent can do it with the tools it names. */
  Agent = 'agent',
}
