import { HttpStatus } from '@nestjs/common';
import { SANDBOX_MAX_PRODUCTS } from '../entitlements.constants.js';
import { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';
import { SandboxRestrictedException } from '../errors/sandbox-restricted.exception.js';
import type { SandboxStatusRepository } from '../repositories/sandbox-status.repository.js';
import { SandboxPolicy } from './sandbox-policy.js';

const EXPIRES_AT = new Date('2026-11-21T10:00:00.000Z');

function setup(sandbox: { expiresAt: Date } | null, productCount = 0) {
  const repository = {
    findUnclaimed: vi.fn<SandboxStatusRepository['findUnclaimed']>().mockResolvedValue(sandbox),
    countProducts: vi
      .fn<SandboxStatusRepository['countProducts']>()
      .mockResolvedValue(productCount),
  };
  return {
    repository,
    policy: new SandboxPolicy(repository as unknown as SandboxStatusRepository),
  };
}

describe('SandboxPolicy', () => {
  it('lets every workspace that is not an unclaimed sandbox through', async () => {
    const { policy, repository } = setup(null);
    await expect(
      policy.assertAllows({ workspaceId: 'ws-1' }, SandboxRestriction.ConnectChannel),
    ).resolves.toBeUndefined();
    expect(repository.findUnclaimed).toHaveBeenCalledWith({ workspaceId: 'ws-1' });
  });

  it('refuses a restricted action with 403 and a code that tells the agent to have it claimed', async () => {
    const { policy } = setup({ expiresAt: EXPIRES_AT });
    const refusal = policy.assertAllows({ organizationId: 'org-1' }, SandboxRestriction.Publish);

    await expect(refusal).rejects.toBeInstanceOf(SandboxRestrictedException);
    await expect(refusal).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
    const error = await refusal.then(
      () => null,
      (thrown: SandboxRestrictedException) => thrown,
    );
    const body = error?.getResponse();
    expect(body).toMatchObject({
      code: EntitlementErrorCode.SandboxClaimRequired,
      restriction: SandboxRestriction.Publish,
      claimExpiresAt: EXPIRES_AT.toISOString(),
    });
    expect(JSON.stringify(body)).toContain('Ask the user to claim it');
  });

  it('allows products up to the cap, and refuses going past it', async () => {
    const full = setup({ expiresAt: EXPIRES_AT }, SANDBOX_MAX_PRODUCTS - 2);
    await expect(full.policy.assertProductRoom('ws-1', 2)).resolves.toBeUndefined();
    await expect(full.policy.assertProductRoom('ws-1', 3)).rejects.toMatchObject({
      refusal: { restriction: SandboxRestriction.AddProducts, productCount: 98 },
    });
  });

  it('never counts products outside a sandbox, or when nothing is added', async () => {
    const normal = setup(null);
    await normal.policy.assertProductRoom('ws-1', 500);
    expect(normal.repository.countProducts).not.toHaveBeenCalled();

    const sandbox = setup({ expiresAt: EXPIRES_AT });
    await sandbox.policy.assertProductRoom('ws-1', 0);
    expect(sandbox.repository.findUnclaimed).not.toHaveBeenCalled();
  });
});
