import { HttpStatus } from '@nestjs/common';
import type { FeatureGrant } from '../entities/plan-snapshot.js';
import { EntitlementExceededException } from '../errors/entitlement-exceeded.exception.js';
import { FeatureKind } from '../enums/feature-kind.enum.js';
import { Feature } from '../enums/feature.enum.js';
import type { OrganizationScope } from '../repositories/usage.repository.js';
import { planSnapshot } from '../testing/entitlement.fixtures.js';
import type { EntitlementEnforcement } from './entitlement-enforcement.js';
import { EntitlementService } from './entitlement.service.js';
import type { OrganizationPlanService } from './organization-plan.service.js';
import type { UsageMeter } from './usage-meter.js';

const SCOPE: OrganizationScope = { organizationId: 'org-1', workspaceIds: ['ws-1', 'ws-2'] };
const GRANTS: FeatureGrant[] = [
  { feature: Feature.ChannelConnections, kind: FeatureKind.Limit, enabled: true, limit: 2 },
  { feature: Feature.ActiveListings, kind: FeatureKind.Limit, enabled: true, limit: null },
  { feature: Feature.BringYourOwnKey, kind: FeatureKind.Flag, enabled: false, limit: 0 },
  { feature: Feature.AiCredits, kind: FeatureKind.Limit, enabled: true, limit: 100 },
];

function setup(enforced = true, inUse = 2) {
  const plans = {
    current: vi.fn<OrganizationPlanService['current']>().mockResolvedValue(planSnapshot(GRANTS)),
  };
  const meter = {
    scopeOf: vi.fn<UsageMeter['scopeOf']>().mockResolvedValue(SCOPE),
    count: vi.fn<UsageMeter['count']>().mockResolvedValue(inUse),
    organizationIdOf: vi.fn<UsageMeter['organizationIdOf']>().mockResolvedValue('org-1'),
  };
  const enforcement = { enforced } as EntitlementEnforcement;
  const service = new EntitlementService(
    plans as unknown as OrganizationPlanService,
    meter as unknown as UsageMeter,
    enforcement,
  );
  return { service, plans, meter };
}

describe('EntitlementService', () => {
  it('reads limits from the plan: a number, null for unlimited, 0 when not included', async () => {
    const { service } = setup();
    expect(await service.limit('org-1', Feature.ChannelConnections)).toBe(2);
    expect(await service.limit('org-1', Feature.ActiveListings)).toBeNull();
    expect(await service.limit('org-1', Feature.BringYourOwnKey)).toBe(0);
    expect(await service.isEnabled('org-1', Feature.BringYourOwnKey)).toBe(false);
  });

  it('counts usage across the organization, and flags as 0', async () => {
    const { service, meter } = setup();
    expect(await service.usage('org-1', Feature.ChannelConnections)).toBe(2);
    expect(meter.count).toHaveBeenCalledWith(SCOPE, Feature.ChannelConnections);
    meter.count.mockResolvedValueOnce(null);
    expect(await service.usage('org-1', Feature.BringYourOwnKey)).toBe(0);
  });

  it('checks whether more fits, whatever the enforcement setting', async () => {
    const { service } = setup(false);
    await expect(service.check('org-1', Feature.ChannelConnections)).resolves.toMatchObject({
      allowed: false,
      limit: 2,
      usage: 2,
      requested: 1,
    });
    await expect(service.check('org-1', Feature.ChannelConnections, 0)).resolves.toMatchObject({
      allowed: true,
    });
  });

  it('throws a 402 when enforcement is on and it does not fit', async () => {
    const { service } = setup(true);
    const refusal = await service
      .assert('org-1', Feature.ChannelConnections)
      .catch((error) => error);
    expect(refusal).toBeInstanceOf(EntitlementExceededException);
    expect((refusal as EntitlementExceededException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
    await expect(service.assert('org-1', Feature.ActiveListings, 500)).resolves.toBeUndefined();
  });

  it('only reports while enforcement is off, without reading plans', async () => {
    const { service, plans, meter } = setup(false);
    await expect(service.assert('org-1', Feature.ChannelConnections)).resolves.toBeUndefined();
    await expect(service.violationInWorkspace('ws-1', Feature.ChannelConnections)).resolves.toBe(
      null,
    );
    expect(plans.current).not.toHaveBeenCalled();
    expect(meter.organizationIdOf).not.toHaveBeenCalled();
  });

  it('checks a workspace against its organization', async () => {
    const { service, meter, plans } = setup(true, 1);
    await expect(
      service.assertInWorkspace('ws-2', Feature.ChannelConnections),
    ).resolves.toBeUndefined();
    expect(meter.organizationIdOf).toHaveBeenCalledWith('ws-2');
    expect(plans.current).toHaveBeenCalledWith('org-1');
    meter.count.mockResolvedValueOnce(2);
    await expect(
      service.assertInWorkspace('ws-2', Feature.ChannelConnections),
    ).rejects.toBeInstanceOf(EntitlementExceededException);
  });

  it('refuses AI calls once the month’s credits are spent, and only while enforced', async () => {
    const { service, meter } = setup(true, 99);
    await expect(service.assertInWorkspace('ws-1', Feature.AiCredits)).resolves.toBeUndefined();
    await expect(service.assertInWorkspace('ws-1', Feature.AiCredits, 2)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
    expect(meter.count).toHaveBeenCalledWith(SCOPE, Feature.AiCredits);

    const reporting = setup(false, 100);
    await expect(
      reporting.service.assertInWorkspace('ws-1', Feature.AiCredits),
    ).resolves.toBeUndefined();
  });
});
