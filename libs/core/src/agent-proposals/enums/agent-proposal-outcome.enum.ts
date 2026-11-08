/** What became of a call sent to be proposed (ADR 0028). Part of the API. */
export enum AgentProposalOutcome {
  /** Stored as a proposal that waits for the seller. */
  Proposed = 'proposed',
  /** The workspace lets outside agents change things at once: make the call directly. */
  ApplyDirectly = 'apply_directly',
}
