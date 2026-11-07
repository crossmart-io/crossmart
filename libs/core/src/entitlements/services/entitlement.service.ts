import { Injectable } from '@nestjs/common';
import type { EntitlementCheck } from '../entities/entitlement-check.js';
import type { FeatureGrant, PlanSnapshot } from '../entities/plan-snapshot.js';
import type { Feature } from '../enums/feature.enum.js';
import type { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';
import { EntitlementExceededException } from '../errors/entitlement-exceeded.exception.js';
import { evaluateEntitlement } from '../rules/evaluate-entitlement.js';
import { EntitlementEnforcement } from './entitlement-enforcement.js';
import { OrganizationPlanService } from './organization-plan.service.js';
import { SandboxPolicy } from './sandbox-policy.js';
import { UsageMeter } from './usage-meter.js';

const ONE_MORE = 1;

function grantOf(snapshot: PlanSnapshot, feature: Feature): FeatureGrant {
  const grant = snapshot.grants.get(feature);
  if (!grant) {
    throw new Error(`Plan grants are missing ${feature}`);
  }
  return grant;
}

/**
 * Answers every plan question: what an organization's plan allows of a feature, what it uses,
 * and whether it may use more. Callers never read plan names or numbers themselves.
 * `assert` blocks only while `ENTITLEMENTS_ENFORCED` is on; `check` always tells the truth.
 * Unclaimed sandbox accounts (ADR 0019) have rules of their own, which always apply. Whether a
 * subscription leaves the organization read-only is `SubscriptionAccessPolicy`'s (ADR 0024).
 */
@Injectable()
export class EntitlementService {
  constructor(
    private readonly plans: OrganizationPlanService,
    private readonly meter: UsageMeter,
    private readonly enforcement: EntitlementEnforcement,
    private readonly sandbox: SandboxPolicy,
  ) {}

  get enforced(): boolean {
    return this.enforcement.enforced;
  }

  /** How many the plan allows: null is unlimited, 0 is not included. Enabled flags are null. */
  async limit(organizationId: string, feature: Feature): Promise<number | null> {
    return grantOf(await this.plans.current(organizationId), feature).limit;
  }

  async isEnabled(organizationId: string, feature: Feature): Promise<boolean> {
    return grantOf(await this.plans.current(organizationId), feature).enabled;
  }

  /** What is in use now, counted from the data. Flags are 0. */
  async usage(organizationId: string, feature: Feature): Promise<number> {
    const scope = await this.meter.scopeOf(organizationId);
    return (await this.meter.count(scope, feature)) ?? 0;
  }

  /** Whether `increment` more fits the plan, whatever the enforcement setting. */
  async check(
    organizationId: string,
    feature: Feature,
    increment = ONE_MORE,
  ): Promise<EntitlementCheck> {
    const [snapshot, usage] = await Promise.all([
      this.plans.current(organizationId),
      this.usage(organizationId, feature),
    ]);
    const grant = grantOf(snapshot, feature);
    return evaluateEntitlement({ plan: snapshot.plan, grant, usage, requested: increment });
  }

  /** The refusal to report when enforcement is on and the plan does not allow it, else null. */
  async violation(
    organizationId: string,
    feature: Feature,
    increment = ONE_MORE,
  ): Promise<EntitlementExceededException | null> {
    if (!this.enforced) return null;
    const check = await this.check(organizationId, feature, increment);
    return check.allowed ? null : new EntitlementExceededException(check);
  }

  /** Throws `EntitlementExceededException` (HTTP 402) when enforcement is on and it does not fit. */
  async assert(organizationId: string, feature: Feature, increment = ONE_MORE): Promise<void> {
    const violation = await this.violation(organizationId, feature, increment);
    if (violation) throw violation;
  }

  /** `violation` for the organization a workspace belongs to. */
  async violationInWorkspace(
    workspaceId: string,
    feature: Feature,
    increment = ONE_MORE,
  ): Promise<EntitlementExceededException | null> {
    if (!this.enforced) return null;
    return this.violation(await this.meter.organizationIdOf(workspaceId), feature, increment);
  }

  /** `assert` for the organization a workspace belongs to. */
  async assertInWorkspace(
    workspaceId: string,
    feature: Feature,
    increment = ONE_MORE,
  ): Promise<void> {
    const violation = await this.violationInWorkspace(workspaceId, feature, increment);
    if (violation) throw violation;
  }

  /**
   * Throws `SandboxRestrictedException` (HTTP 403, `sandbox_claim_required`) when the workspace
   * is an unclaimed sandbox account, which may not do `restriction` until its owner claims it.
   */
  assertSandboxAllows(workspaceId: string, restriction: SandboxRestriction): Promise<void> {
    return this.sandbox.assertAllows({ workspaceId }, restriction);
  }

  /** `assertSandboxAllows` for an organization, for actions outside any one workspace. */
  assertSandboxAllowsInOrganization(
    organizationId: string,
    restriction: SandboxRestriction,
  ): Promise<void> {
    return this.sandbox.assertAllows({ organizationId }, restriction);
  }

  /** Throws `SandboxRestrictedException` when `increment` more products exceed a sandbox's cap. */
  assertProductRoom(workspaceId: string, increment = ONE_MORE): Promise<void> {
    return this.sandbox.assertProductRoom(workspaceId, increment);
  }
}
