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
  /**
   * The organization's subscription is not in good standing (canceled, unpaid, past due after
   * the grace period, or never started), so it is read-only until a billing admin fixes it.
   */
  SubscriptionInactive = 'subscription_inactive',
}
