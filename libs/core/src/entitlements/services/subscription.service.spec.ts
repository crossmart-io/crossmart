import { FeatureKind } from '../enums/feature-kind.enum.js';
import { Feature } from '../enums/feature.enum.js';
import { toFeatureGrants } from '../rules/feature-grants.js';
import { planSnapshot, TEST_PLAN } from '../testing/entitlement.fixtures.js';
import type { EntitlementEnforcement } from './entitlement-enforcement.js';
import type { OrganizationPlanService } from './organization-plan.service.js';
import { SubscriptionService } from './subscription.service.js';
import type { UsageMeter } from './usage-meter.js';

describe('SubscriptionService.overview', () => {
  it('lists every feature with what the plan allows and what is in use', async () => {
    const grants = toFeatureGrants([
      { feature: Feature.ActiveListings, enabled: true, limit: 50 },
      { feature: Feature.AutonomousAgents, enabled: true, limit: null },
    ]);
    const plans = {
      current: vi
        .fn<OrganizationPlanService['current']>()
        .mockResolvedValue(planSnapshot([...grants.values()])),
    };
    const scope = { organizationId: 'org-1', workspaceIds: ['ws-1'] };
    const meter = {
      scopeOf: vi.fn<UsageMeter['scopeOf']>().mockResolvedValue(scope),
      countAll: vi.fn<UsageMeter['countAll']>().mockResolvedValue(
        new Map([
          [Feature.ActiveListings, 12],
          [Feature.AutonomousAgents, null],
        ]),
      ),
    };
    const service = new SubscriptionService(
      plans as unknown as OrganizationPlanService,
      meter as unknown as UsageMeter,
      { enforced: false } as EntitlementEnforcement,
    );

    const overview = await service.overview('org-1');

    expect(meter.countAll).toHaveBeenCalledWith(scope, Object.values(Feature));
    expect(overview).toMatchObject({ organizationId: 'org-1', plan: TEST_PLAN, enforced: false });
    expect(overview.features.map((feature) => feature.feature)).toEqual(Object.values(Feature));
    expect(overview.features[0]).toEqual({
      feature: Feature.ActiveListings,
      kind: FeatureKind.Limit,
      enabled: true,
      limit: 50,
      usage: 12,
    });
    expect(
      overview.features.find((entry) => entry.feature === Feature.AutonomousAgents),
    ).toMatchObject({
      enabled: true,
      usage: null,
    });
    expect(overview).not.toHaveProperty('grants');
  });
});
