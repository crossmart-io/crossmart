/** Machine-readable reasons a plan refuses an action, sent as `code` in the error body. */
export enum EntitlementErrorCode {
  /** The action would take a counted feature past the plan's limit. */
  PlanLimitReached = 'plan_limit_reached',
  /** The plan does not include the feature at all. */
  FeatureNotIncluded = 'plan_feature_not_included',
}
