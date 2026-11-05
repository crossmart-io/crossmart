import type { EntitlementCheck } from '../entities/entitlement-check.js';
import type { FeatureGrant, PlanSnapshot } from '../entities/plan-snapshot.js';
import { EntitlementExceededException } from '../errors/entitlement-exceeded.exception.js';
import { FEATURE_KINDS } from '../entitlements.constants.js';
import type { Feature } from '../enums/feature.enum.js';
import { SubscriptionStatus } from '@crossmart/database';

export const TEST_PLAN = { code: 'free', name: 'Free', version: 1 };

/** A failed check of a counted feature: `limit` in use, one more requested. */
export function limitReachedCheck(feature: Feature, limit = 2): EntitlementCheck {
  return {
    feature,
    kind: FEATURE_KINDS[feature],
    plan: TEST_PLAN,
    allowed: false,
    enabled: true,
    limit,
    usage: limit,
    requested: 1,
  };
}

export function planLimitReached(feature: Feature, limit = 2): EntitlementExceededException {
  return new EntitlementExceededException(limitReachedCheck(feature, limit));
}

/** A plan snapshot granting `grants`, for services that read plans. */
export function planSnapshot(grants: FeatureGrant[]): PlanSnapshot {
  return {
    organizationId: 'org-1',
    plan: TEST_PLAN,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: null,
    grants: new Map(grants.map((grant) => [grant.feature, grant])),
  };
}
