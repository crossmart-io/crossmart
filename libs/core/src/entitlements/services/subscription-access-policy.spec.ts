import { HttpStatus } from '@nestjs/common';
import { SubscriptionStatus } from '@crossmart/database';
import { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import { SubscriptionAccessState } from '../enums/subscription-access-state.enum.js';
import { SubscriptionInactiveException } from '../errors/subscription-inactive.exception.js';
import type { SandboxStatusRepository } from '../repositories/sandbox-status.repository.js';
import type { UsageRepository } from '../repositories/usage.repository.js';
import type {
  StandingRecord,
  SubscriptionRepository,
} from '../repositories/subscription.repository.js';
import type { EntitlementEnforcement } from './entitlement-enforcement.js';
import { SubscriptionAccessPolicy } from './subscription-access-policy.js';

const CANCELED: StandingRecord = {
  status: SubscriptionStatus.CANCELED,
  externalSubscriptionId: 'sub_1',
  trialEnd: null,
  pastDueSince: null,
  cancelAt: null,
};

interface Setup {
  billingEnabled?: boolean;
  enforced?: boolean;
  record?: StandingRecord;
  /** No subscription row at all, as for an organization from before plans. */
  missing?: boolean;
  sandbox?: boolean;
}

function setup({
  billingEnabled = true,
  enforced = true,
  record = CANCELED,
  missing = false,
  sandbox = false,
}: Setup) {
  const subscriptions = {
    findStanding: vi
      .fn<SubscriptionRepository['findStanding']>()
      .mockResolvedValue(missing ? null : record),
  };
  const sandboxes = {
    findUnclaimed: vi
      .fn<SandboxStatusRepository['findUnclaimed']>()
      .mockResolvedValue(sandbox ? { expiresAt: new Date() } : null),
  };
  const usage = {
    organizationIdOf: vi.fn<UsageRepository['organizationIdOf']>().mockResolvedValue('org-1'),
  };
  const enforcement = {
    billingEnabled,
    subscriptionsEnforced: billingEnabled && enforced,
    subscriptionTerms: { pastDueGraceDays: 7, legacyAccessUntil: null },
  } as EntitlementEnforcement;
  const policy = new SubscriptionAccessPolicy(
    subscriptions as unknown as SubscriptionRepository,
    sandboxes as unknown as SandboxStatusRepository,
    usage as unknown as UsageRepository,
    enforcement,
  );
  return { policy, subscriptions, usage };
}

describe('SubscriptionAccessPolicy', () => {
  it('restricts nothing and reads nothing where billing is off', async () => {
    const { policy, subscriptions } = setup({ billingEnabled: false });

    await expect(policy.access('org-1')).resolves.toMatchObject({
      state: SubscriptionAccessState.Unrestricted,
      writable: true,
    });
    await expect(policy.assertWritable('org-1')).resolves.toBeUndefined();
    expect(subscriptions.findStanding).not.toHaveBeenCalled();
  });

  it('refuses writes of a canceled organization with a 402 agents can act on', async () => {
    const { policy } = setup({});

    const refusal = await policy.assertWritable('org-1').catch((error: unknown) => error);

    expect(refusal).toBeInstanceOf(SubscriptionInactiveException);
    const exception = refusal as SubscriptionInactiveException;
    expect(exception.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(exception.getResponse()).toMatchObject({
      code: EntitlementErrorCode.SubscriptionInactive,
      state: SubscriptionAccessState.Canceled,
    });
    expect(exception.message).toContain('Ask an owner or admin of the organization');
  });

  it('reports the read-only state but blocks nothing while limits are not enforced', async () => {
    const { policy } = setup({ enforced: false });

    await expect(policy.access('org-1')).resolves.toMatchObject({ writable: false });
    await expect(policy.assertWritable('org-1')).resolves.toBeUndefined();
  });

  it('treats an organization with no subscription row as one from before billing', async () => {
    const { policy } = setup({ missing: true });

    await expect(policy.access('org-1')).resolves.toMatchObject({
      state: SubscriptionAccessState.Legacy,
      writable: true,
    });
  });

  it('leaves an unclaimed sandbox to the sandbox rules', async () => {
    const { policy } = setup({
      record: { ...CANCELED, status: SubscriptionStatus.INCOMPLETE, externalSubscriptionId: null },
      sandbox: true,
    });

    await expect(policy.assertWritable('org-1')).resolves.toBeUndefined();
    await expect(policy.access('org-1')).resolves.toMatchObject({
      state: SubscriptionAccessState.Sandbox,
    });
  });

  it('checks a workspace through its organization, and only where enforced', async () => {
    const off = setup({ enforced: false });
    await off.policy.assertWritableInWorkspace('ws-1');
    expect(off.usage.organizationIdOf).not.toHaveBeenCalled();

    const on = setup({});
    await expect(on.policy.assertWritableInWorkspace('ws-1')).rejects.toBeInstanceOf(
      SubscriptionInactiveException,
    );
    expect(on.usage.organizationIdOf).toHaveBeenCalledWith('ws-1');
    await expect(on.policy.accessInWorkspace('ws-1')).resolves.toMatchObject({
      state: SubscriptionAccessState.Canceled,
    });
  });
});
