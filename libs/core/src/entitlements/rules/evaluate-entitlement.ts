import type { EntitlementCheck } from '../entities/entitlement-check.js';
import type { FeatureGrant, PlanReference } from '../entities/plan-snapshot.js';
import { FeatureKind } from '../enums/feature-kind.enum.js';

/** What a check is about: the plan's grant, what is in use, and how many more are wanted. */
export interface EntitlementRequest {
  plan: PlanReference;
  grant: FeatureGrant;
  usage: number;
  requested: number;
}

/**
 * Whether a counted feature has room. Asking for nothing more (a reconnect, an update) always
 * fits, even past the limit, so moving to a smaller plan never blocks what already exists.
 */
function hasRoom({ grant, usage, requested }: EntitlementRequest): boolean {
  if (requested <= 0 || grant.limit === null) return true;
  return usage + requested <= grant.limit;
}

/** Whether the plan allows the request: a flag must be on, a limit must have room. */
export function evaluateEntitlement(request: EntitlementRequest): EntitlementCheck {
  const { plan, grant, usage, requested } = request;
  const allowed = grant.kind === FeatureKind.Flag ? grant.enabled : hasRoom(request);
  const { feature, kind, enabled, limit } = grant;
  return { feature, kind, plan, allowed, enabled, limit, usage, requested };
}
