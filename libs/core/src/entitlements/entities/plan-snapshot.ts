import type { SubscriptionStatus } from '@crossmart/database';
import type { FeatureKind } from '../enums/feature-kind.enum.js';
import type { Feature } from '../enums/feature.enum.js';

/** The plan version an organization is on, as people and billing name it. */
export interface PlanReference {
  code: string;
  name: string;
  version: number;
}

/**
 * What a plan grants for one feature. `limit` is how many it allows: null is unlimited, and a
 * feature that is not included allows 0. Flags have no limit when enabled.
 */
export interface FeatureGrant {
  feature: Feature;
  kind: FeatureKind;
  enabled: boolean;
  limit: number | null;
}

/** The organization's subscription with everything its plan version grants. */
export interface PlanSnapshot {
  organizationId: string;
  plan: PlanReference;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  grants: ReadonlyMap<Feature, FeatureGrant>;
}
