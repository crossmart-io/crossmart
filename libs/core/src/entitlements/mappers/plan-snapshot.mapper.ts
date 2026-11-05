import type { PlanSnapshot } from '../entities/plan-snapshot.js';
import type { SubscriptionRecord } from '../repositories/subscription.repository.js';
import { toFeatureGrants } from '../rules/feature-grants.js';

export function toPlanSnapshot(record: SubscriptionRecord): PlanSnapshot {
  const { planVersion } = record;
  return {
    organizationId: record.organizationId,
    plan: {
      code: planVersion.plan.code,
      name: planVersion.plan.name,
      version: planVersion.version,
    },
    status: record.status,
    currentPeriodEnd: record.currentPeriodEnd,
    grants: toFeatureGrants(planVersion.features),
  };
}
