import { hashSecret } from '@crossmart/common';
import { ActivityActorType, SubscriptionStatus, WorkspaceRole } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import { API_KEY_TOKEN_PREFIX } from '../../tenancy/tenancy.constants.js';
import { SandboxOpeningOutcome } from '../enums/sandbox-opening-outcome.enum.js';
import type { SandboxAccountRepository } from '../repositories/sandbox-account.repository.js';
import {
  SANDBOX_AGENT_KEY_NAME,
  SANDBOX_AGENT_KEY_ROLE,
  SANDBOX_TTL_MS,
} from '../sandbox.constants.js';
import type { SandboxClaimMailer } from './sandbox-claim.mailer.js';
import { SandboxAccountsService } from './sandbox-accounts.service.js';

const REQUEST = { email: '  Ana@Example.com ', storeName: ' Ana Ceramics ' };

function setup(emailHasAccount = false) {
  const accounts = {
    emailHasAccount: vi
      .fn<SandboxAccountRepository['emailHasAccount']>()
      .mockResolvedValue(emailHasAccount),
    create: vi
      .fn<SandboxAccountRepository['create']>()
      .mockResolvedValue({ workspaceId: 'ws-1', apiKeyId: 'key-1' }),
  };
  const plans = {
    startingSubscription: vi
      .fn<OrganizationPlanService['startingSubscription']>()
      .mockResolvedValue({ planVersionId: 'plan-v1', status: SubscriptionStatus.INCOMPLETE }),
  };
  const mailer = { sendClaimLink: vi.fn<SandboxClaimMailer['sendClaimLink']>() };
  const activity = new InMemoryActivityRecorder();
  const service = new SandboxAccountsService(
    accounts as unknown as SandboxAccountRepository,
    plans as unknown as OrganizationPlanService,
    mailer as unknown as SandboxClaimMailer,
    activity,
  );
  return { service, accounts, mailer, activity };
}

describe('SandboxAccountsService', () => {
  it('opens a sandbox, gives the agent an Editor key and emails the claim link', async () => {
    const { service, accounts, mailer } = setup();
    const before = Date.now();

    const opening = await service.open(REQUEST);

    expect(opening).toMatchObject({ outcome: SandboxOpeningOutcome.Created, workspaceId: 'ws-1' });
    if (opening.outcome !== SandboxOpeningOutcome.Created) throw new Error('not created');
    expect(opening.apiKey.startsWith(API_KEY_TOKEN_PREFIX)).toBe(true);
    expect(opening.claimExpiresAt.getTime()).toBeGreaterThanOrEqual(before + SANDBOX_TTL_MS);

    const created = accounts.create.mock.calls[0]?.[0];
    expect(created).toMatchObject({
      email: 'ana@example.com',
      ownerName: 'ana',
      storeName: 'Ana Ceramics',
      subscription: { planVersionId: 'plan-v1', status: SubscriptionStatus.INCOMPLETE },
      agentKey: { name: SANDBOX_AGENT_KEY_NAME, hash: hashSecret(opening.apiKey) },
    });
    expect(SANDBOX_AGENT_KEY_ROLE).toBe(WorkspaceRole.EDITOR);

    const link = mailer.sendClaimLink.mock.calls[0]?.[0];
    expect(link).toMatchObject({ email: 'ana@example.com', storeName: 'Ana Ceramics' });
    expect(created?.claimTokenHash).toBe(hashSecret(link?.token ?? ''));
  });

  it('records the opening, credited to the agent’s key', async () => {
    const { service, activity } = setup();
    await service.open(REQUEST);

    expect(activity.recorded).toEqual([
      expect.objectContaining({
        workspaceId: 'ws-1',
        actor: expect.objectContaining({ type: ActivityActorType.API_KEY, apiKeyId: 'key-1' }),
        entry: expect.objectContaining({
          action: ActivityAction.SandboxCreated,
          detail: 'ana@example.com',
        }),
      }),
    ]);
  });

  it('creates nothing and emails nobody for an address that has an account', async () => {
    const { service, accounts, mailer, activity } = setup(true);

    expect(await service.open(REQUEST)).toEqual({ outcome: SandboxOpeningOutcome.SignInRequired });
    expect(accounts.create).not.toHaveBeenCalled();
    expect(mailer.sendClaimLink).not.toHaveBeenCalled();
    expect(activity.recorded).toEqual([]);
  });

  it('answers the same when the address got an account meanwhile', async () => {
    const { service, accounts, mailer } = setup();
    accounts.create.mockResolvedValueOnce(null);

    expect(await service.open(REQUEST)).toEqual({ outcome: SandboxOpeningOutcome.SignInRequired });
    expect(mailer.sendClaimLink).not.toHaveBeenCalled();
  });
});
