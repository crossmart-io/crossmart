/**
 * Machine-readable reasons a plan, or a sandbox account, refuses an action, sent as `code` in the
 * error body.
 */
export enum EntitlementErrorCode {
  /** The action would take a counted feature past the plan's limit. */
  PlanLimitReached = 'plan_limit_reached',
  /** The plan does not include the feature at all. */
  FeatureNotIncluded = 'plan_feature_not_included',
  /** The workspace is an unclaimed sandbox account (ADR 0019): its owner must claim it first. */
  SandboxClaimRequired = 'sandbox_claim_required',
}
