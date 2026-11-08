/** Where an outside agent's proposal stands (ADR 0028). Stored as text; part of the API. */
export enum AgentProposalStatus {
  /** Waiting for the seller. */
  Pending = 'pending',
  /** Approved and being made now. */
  Applying = 'applying',
  /** Approved and made. */
  Applied = 'applied',
  /** Approved, but the API refused it (a permission, a plan limit, a revoked agent). */
  Failed = 'failed',
  /** The seller rejected it; nothing changed. */
  Rejected = 'rejected',
  /** Nobody decided in time; nothing changed. */
  Expired = 'expired',
}
