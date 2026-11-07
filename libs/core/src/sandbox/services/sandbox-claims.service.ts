import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hashSecret } from '@crossmart/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ClaimedSandbox, SandboxClaimPreview } from '../entities/sandbox-account.js';
import { SandboxClaimOutcome } from '../enums/sandbox-claim-outcome.enum.js';
import { SandboxAccountRepository } from '../repositories/sandbox-account.repository.js';
import { SandboxClaimRepository } from '../repositories/sandbox-claim.repository.js';
import {
  INVALID_CLAIM_LINK,
  NOTHING_TO_CLAIM,
  PASSWORD_ALREADY_SET,
} from '../sandbox.constants.js';

/**
 * Claiming a sandbox account (ADR 0019): from the emailed link with a new password, or signed in
 * as its owner. Either way it happens once, and the workspace is a normal one from then on.
 */
@Injectable()
export class SandboxClaimsService {
  constructor(
    private readonly accounts: SandboxAccountRepository,
    private readonly claims: SandboxClaimRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  /** What the claim page shows. 404 for a link that is unknown, used or expired. */
  async preview(token: string): Promise<SandboxClaimPreview> {
    const preview = await this.accounts.findPreview(hashSecret(token), new Date());
    if (!preview) throw new NotFoundException(INVALID_CLAIM_LINK);
    return preview;
  }

  /**
   * Claims with the link, setting the password the person chose (`passwordHash`, hashed by the
   * auth server). 409 when they have a password already: they sign in and claim from the app.
   */
  async claimWithPassword(token: string, passwordHash: string): Promise<ClaimedSandbox> {
    const result = await this.claims.claimWithPassword(hashSecret(token), passwordHash, new Date());
    switch (result.outcome) {
      case SandboxClaimOutcome.Claimed:
        await this.recordClaim(result.claimed);
        return result.claimed;
      case SandboxClaimOutcome.PasswordAlreadySet:
        throw new ConflictException(PASSWORD_ALREADY_SET);
      case SandboxClaimOutcome.InvalidLink:
        throw new NotFoundException(INVALID_CLAIM_LINK);
    }
  }

  /** Claims for the signed-in owner of the sandbox. 404 for anyone else, or nothing to claim. */
  async claimAsOwner(workspaceId: string, userId: string): Promise<ClaimedSandbox> {
    const claimed = await this.claims.claimForOwner(workspaceId, userId, new Date());
    if (!claimed) throw new NotFoundException(NOTHING_TO_CLAIM);
    await this.recordClaim(claimed);
    return claimed;
  }

  private recordClaim(claimed: ClaimedSandbox): Promise<void> {
    return this.activity.record(claimed.workspaceId, Actor.user(claimed.userId), {
      action: ActivityAction.SandboxClaimed,
      subject: {
        type: ActivitySubjectType.Workspace,
        id: claimed.workspaceId,
        label: claimed.storeName,
      },
    });
  }
}
