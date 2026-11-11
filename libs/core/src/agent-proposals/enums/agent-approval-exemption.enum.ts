/**
 * Why a call that would otherwise wait for the seller's approval applies at once (ADR 0028,
 * amended 2026-11-11). Part of the API.
 */
export enum AgentApprovalExemption {
  /** A new product created as a draft: nothing is listed, for sale or changed for buyers. */
  NewDraft = 'new_draft',
}
