import type { FeatureKind } from '../enums/feature-kind.enum.js';
import type { Feature } from '../enums/feature.enum.js';
import type { FeatureGrant, PlanReference, PlanSnapshot } from './plan-snapshot.js';

/** Whether an organization's plan allows `requested` more of a feature, and why. */
export interface EntitlementCheck {
  feature: Feature;
  kind: FeatureKind;
  plan: PlanReference;
  allowed: boolean;
  enabled: boolean;
  /** Null is unlimited. */
  limit: number | null;
  /** What is in use now, before the request. Flags use 0. */
  usage: number;
  requested: number;
}

/** A feature with what it allows and what is in use, for the plan and usage page. */
export interface FeatureUsage extends FeatureGrant {
  /** Null for flags, which are not counted. */
  usage: number | null;
}

/** An organization's plan and its usage of every feature. */
export interface SubscriptionOverview extends Omit<PlanSnapshot, 'grants'> {
  /** Whether limits block actions here, or are only reported. */
  enforced: boolean;
  features: FeatureUsage[];
}
