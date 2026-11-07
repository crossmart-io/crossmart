import { HttpStatus, NotFoundException } from '@nestjs/common';
import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { sandboxRestricted } from '../../entitlements/testing/sandbox-entitlements.js';
import type { BillingAccountRecord } from '../repositories/billing-account.repository.js';
import { billingAccount } from '../testing/billing-account.fixtures.js';
import {
  FAKE_CHECKOUT_URL,
  FakeBillingProvider,
  fakePrice,
} from '../testing/fake-billing-provider.js';
import type { BillingAccountService } from './billing-account.service.js';
import { BillingCheckoutService } from './billing-checkout.service.js';
import type { BillingPlansService } from './billing-plans.service.js';

const START = {
  organizationId: 'org-1',
  planCode: 'starter',
  interval: BillingInterval.MONTHLY,
  email: 'owner@example.com',
};

function setup(current: BillingAccountRecord = billingAccount()) {
  const provider = new FakeBillingProvider();
  const accounts = {
    assertEnabled: vi.fn<BillingAccountService['assertEnabled']>(),
    get: vi.fn<BillingAccountService['get']>().mockResolvedValue(current),
    customerOf: vi.fn<BillingAccountService['customerOf']>().mockResolvedValue('cus_1'),
    trialDaysFor: vi.fn<BillingAccountService['trialDaysFor']>().mockReturnValue(7),
  };
  const plans = {
    priceFor: vi
      .fn<BillingPlansService['priceFor']>()
      .mockResolvedValue(fakePrice('starter', BillingInterval.MONTHLY, 2900)),
  };
  const entitlements = {
    assertSandboxAllowsInOrganization: vi
      .fn<EntitlementService['assertSandboxAllowsInOrganization']>()
      .mockResolvedValue(),
  };
  const service = new BillingCheckoutService(
    accounts as unknown as BillingAccountService,
    plans as unknown as BillingPlansService,
    entitlements as unknown as EntitlementService,
    provider,
  );
  return { service, provider, accounts, entitlements };
}

describe('BillingCheckoutService', () => {
  it('starts checkout for the plan price, the customer and the trial the account gets', async () => {
    const { service, provider, accounts } = setup();

    await expect(service.startCheckout(START)).resolves.toEqual({ url: FAKE_CHECKOUT_URL });

    expect(accounts.customerOf).toHaveBeenCalledWith(billingAccount(), 'owner@example.com');
    expect(provider.checkouts).toEqual([
      {
        organizationId: 'org-1',
        customerId: 'cus_1',
        priceId: 'price_starter_monthly',
        planCode: 'starter',
        trialDays: 7,
      },
    ]);
  });

  it('sends an organization with a live subscription to the portal instead', async () => {
    const { service, provider } = setup(
      billingAccount({ status: SubscriptionStatus.PAST_DUE, externalSubscriptionId: 'sub_1' }),
    );

    await expect(service.startCheckout(START)).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
    expect(provider.checkouts).toHaveLength(0);
  });

  it('lets a canceled organization subscribe again', async () => {
    const { service, provider } = setup(
      billingAccount({ status: SubscriptionStatus.CANCELED, externalSubscriptionId: 'sub_old' }),
    );

    await service.startCheckout(START);

    expect(provider.checkouts).toHaveLength(1);
  });

  it('lets no unclaimed sandbox pay', async () => {
    const { service, provider, entitlements } = setup();
    entitlements.assertSandboxAllowsInOrganization.mockRejectedValueOnce(
      sandboxRestricted(SandboxRestriction.Subscribe),
    );

    await expect(service.startCheckout(START)).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
    expect(entitlements.assertSandboxAllowsInOrganization).toHaveBeenCalledWith(
      'org-1',
      SandboxRestriction.Subscribe,
    );
    expect(provider.checkouts).toHaveLength(0);
  });

  it('starts nothing where billing is off', async () => {
    const { service, provider, accounts } = setup();
    accounts.assertEnabled.mockImplementationOnce(() => {
      throw new NotFoundException();
    });

    await expect(service.startCheckout(START)).rejects.toBeInstanceOf(NotFoundException);
    expect(provider.checkouts).toHaveLength(0);
  });
});
