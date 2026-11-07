import { ConflictException, NotFoundException } from '@nestjs/common';
import { hashSecret } from '@crossmart/common';
import { ActivityActorType } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { SandboxClaimOutcome } from '../enums/sandbox-claim-outcome.enum.js';
import type { SandboxAccountRepository } from '../repositories/sandbox-account.repository.js';
import type { SandboxClaimRepository } from '../repositories/sandbox-claim.repository.js';
import { SandboxClaimsService } from './sandbox-claims.service.js';

const CLAIMED = {
  workspaceId: 'ws-1',
  userId: 'user-1',
  email: 'ana@example.com',
  storeName: 'Ana Ceramics',
};

function setup() {
  const accounts = { findPreview: vi.fn<SandboxAccountRepository['findPreview']>() };
  const claims = {
    claimWithPassword: vi
      .fn<SandboxClaimRepository['claimWithPassword']>()
      .mockResolvedValue({ outcome: SandboxClaimOutcome.Claimed, claimed: CLAIMED }),
    claimForOwner: vi.fn<SandboxClaimRepository['claimForOwner']>().mockResolvedValue(CLAIMED),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new SandboxClaimsService(
    accounts as unknown as SandboxAccountRepository,
    claims as unknown as SandboxClaimRepository,
    activity,
  );
  return { service, accounts, claims, activity };
}

describe('SandboxClaimsService', () => {
  it('previews a link by its token’s hash, and 404s one that does not work', async () => {
    const { service, accounts } = setup();
    accounts.findPreview.mockResolvedValueOnce(null);

    await expect(service.preview('token-1')).rejects.toThrow(NotFoundException);
    expect(accounts.findPreview).toHaveBeenCalledWith(hashSecret('token-1'), expect.any(Date));
  });

  it('claims with a new password and records who claimed it', async () => {
    const { service, claims, activity } = setup();

    expect(await service.claimWithPassword('token-1', 'hashed-password')).toEqual(CLAIMED);
    expect(claims.claimWithPassword).toHaveBeenCalledWith(
      hashSecret('token-1'),
      'hashed-password',
      expect.any(Date),
    );
    expect(activity.recorded).toEqual([
      expect.objectContaining({
        workspaceId: 'ws-1',
        actor: expect.objectContaining({ type: ActivityActorType.USER, userId: 'user-1' }),
        entry: expect.objectContaining({ action: ActivityAction.SandboxClaimed }),
      }),
    ]);
  });

  it('sends someone with a password to sign in, and refuses a used link', async () => {
    const { service, claims, activity } = setup();
    claims.claimWithPassword
      .mockResolvedValueOnce({ outcome: SandboxClaimOutcome.PasswordAlreadySet })
      .mockResolvedValueOnce({ outcome: SandboxClaimOutcome.InvalidLink });

    await expect(service.claimWithPassword('t', 'h')).rejects.toThrow(ConflictException);
    await expect(service.claimWithPassword('t', 'h')).rejects.toThrow(NotFoundException);
    expect(activity.recorded).toEqual([]);
  });

  it('claims for the signed-in owner only', async () => {
    const { service, claims } = setup();
    expect(await service.claimAsOwner('ws-1', 'user-1')).toEqual(CLAIMED);
    expect(claims.claimForOwner).toHaveBeenCalledWith('ws-1', 'user-1', expect.any(Date));

    claims.claimForOwner.mockResolvedValueOnce(null);
    await expect(service.claimAsOwner('ws-1', 'someone-else')).rejects.toThrow(NotFoundException);
  });
});
