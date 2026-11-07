import { HttpStatus, NotFoundException } from '@nestjs/common';
import type { AppConfigService } from '@crossmart/common';
import { SubscriptionStatus } from '@crossmart/database';
import type { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import { planSnapshot } from '../../entitlements/testing/entitlement.fixtures.js';
import type {
  BillingAccountRecord,
  BillingAccountRepository,
} from '../repositories/billing-account.repository.js';
import { billingAccount } from '../testing/billing-account.fixtures.js';
import { FAKE_PORTAL_URL, FakeBillingProvider } from '../testing/fake-billing-provider.js';
import { BillingAccountService } from './billing-account.service.js';

function setup(current: BillingAccountRecord = billingAccount(), billingEnabled = true) {
  const provider = new FakeBillingProvider();
  const accounts = {
    findByOrganization: vi
      .fn<BillingAccountRepository['findByOrganization']>()
      .mockResolvedValue(current),
    saveCustomerId: vi
      .fn<BillingAccountRepository['saveCustomerId']>()
      .mockImplementation((_organizationId, customerId) => Promise.resolve(customerId)),
  };
  const organizationPlans = {
    current: vi.fn<OrganizationPlanService['current']>().mockResolvedValue(planSnapshot([])),
  };
  const appConfig = { billingEnabled, billingSettings: { trialDays: 7 } } as AppConfigService;
  const service = new BillingAccountService(
    accounts as unknown as BillingAccountRepository,
    organizationPlans as unknown as OrganizationPlanService,
    provider,
    appConfig,
  );
  return { service, provider, accounts, organizationPlans };
}

describe('BillingAccountService', () => {
  it('makes sure the organization has a subscription row before reading it', async () => {
    const { service, organizationPlans } = setup();

    await expect(service.get('org-1')).resolves.toMatchObject({ organizationId: 'org-1' });
    expect(organizationPlans.current).toHaveBeenCalledWith('org-1');
  });

  it('creates the provider customer once, and keeps whichever was saved first', async () => {
    const { service, provider, accounts } = setup();
    accounts.saveCustomerId.mockResolvedValueOnce('cus_saved_meanwhile');

    const customerId = await service.customerOf(billingAccount(), 'owner@example.com');

    expect(provider.customers).toEqual([
      { organizationId: 'org-1', name: 'Ana Ceramics', email: 'owner@example.com' },
    ]);
    expect(customerId).toBe('cus_saved_meanwhile');
    await expect(
      service.customerOf(billingAccount({ externalCustomerId: 'cus_1' }), 'owner@example.com'),
    ).resolves.toBe('cus_1');
    expect(provider.customers).toHaveLength(1);
  });

  it('offers the trial to the first subscription only', () => {
    const { service } = setup();

    expect(service.trialDaysFor(billingAccount())).toBe(7);
    expect(service.trialDaysFor(billingAccount({ trialEnd: new Date('2026-10-01') }))).toBe(0);
    expect(
      service.trialDaysFor(
        billingAccount({ status: SubscriptionStatus.CANCELED, externalSubscriptionId: 'sub_old' }),
      ),
    ).toBe(0);
  });

  it('opens the portal for an organization with a customer, and 409 before', async () => {
    const withCustomer = setup(billingAccount({ externalCustomerId: 'cus_1' }));
    await expect(withCustomer.service.openPortal('org-1')).resolves.toEqual({
      url: FAKE_PORTAL_URL,
    });
    expect(withCustomer.provider.portals).toEqual(['cus_1']);

    await expect(setup().service.openPortal('org-1')).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
  });

  it('answers 404 where billing is off', async () => {
    const { service } = setup(billingAccount({ externalCustomerId: 'cus_1' }), false);

    expect(() => service.assertEnabled()).toThrow(NotFoundException);
    await expect(service.openPortal('org-1')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
  });
});
