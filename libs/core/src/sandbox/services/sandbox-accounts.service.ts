import { Injectable, Logger } from '@nestjs/common';
import { generateSecureToken, hashSecret, slugify } from '@crossmart/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import { newApiKeySecret } from '../../tenancy/rules/api-key-secret.js';
import { normalizeEmail } from '../../tenancy/services/invitation-policy.js';
import { DEFAULT_WORKSPACE_NAME } from '../../tenancy/tenancy.constants.js';
import type { SandboxOpening, SandboxRequest } from '../entities/sandbox-account.js';
import { SandboxOpeningOutcome } from '../enums/sandbox-opening-outcome.enum.js';
import { SandboxAccountRepository } from '../repositories/sandbox-account.repository.js';
import { sandboxOwnerName } from '../rules/sandbox-owner-name.js';
import {
  SANDBOX_AGENT_KEY_NAME,
  SANDBOX_CLAIM_TOKEN_BYTES,
  SANDBOX_TTL_MS,
} from '../sandbox.constants.js';
import { SandboxClaimMailer } from './sandbox-claim.mailer.js';

const SIGN_IN_REQUIRED: SandboxOpening = { outcome: SandboxOpeningOutcome.SignInRequired };

/** A sandbox account just written, with the secrets only this request ever sees. */
interface OpenedSandbox {
  workspaceId: string;
  apiKeyId: string;
  apiKey: string;
  claimToken: string;
  expiresAt: Date;
}

/**
 * Opens sandbox accounts for AI agents (ADR 0019): a user without a password, an organization
 * on the default plan, its workspace, and an Editor API key for the agent. The person gets the
 * claim link by email. An address that already has an account gets nothing and no email, and
 * the answer is the same whether it is a customer or another unclaimed sandbox.
 */
@Injectable()
export class SandboxAccountsService {
  private readonly logger = new Logger(SandboxAccountsService.name);

  constructor(
    private readonly accounts: SandboxAccountRepository,
    private readonly plans: OrganizationPlanService,
    private readonly mailer: SandboxClaimMailer,
    private readonly activity: ActivityRecorder,
  ) {}

  async open(request: SandboxRequest): Promise<SandboxOpening> {
    const email = normalizeEmail(request.email);
    if (await this.accounts.emailHasAccount(email)) return SIGN_IN_REQUIRED;
    const storeName = request.storeName.trim();
    const opened = await this.create(email, storeName);
    if (!opened) return SIGN_IN_REQUIRED;
    this.mailer.sendClaimLink({
      email,
      storeName,
      token: opened.claimToken,
      expiresAt: opened.expiresAt,
    });
    await this.recordOpening(opened, storeName, email);
    this.logger.log(`Opened sandbox workspace ${opened.workspaceId}`);
    return {
      outcome: SandboxOpeningOutcome.Created,
      workspaceId: opened.workspaceId,
      apiKey: opened.apiKey,
      claimExpiresAt: opened.expiresAt,
    };
  }

  private async create(email: string, storeName: string): Promise<OpenedSandbox | null> {
    const claimToken = generateSecureToken(SANDBOX_CLAIM_TOKEN_BYTES);
    const { secret, prefix, hash } = newApiKeySecret();
    const expiresAt = new Date(Date.now() + SANDBOX_TTL_MS);
    const created = await this.accounts.create({
      email,
      ownerName: sandboxOwnerName(email),
      storeName,
      workspaceSlug: slugify(DEFAULT_WORKSPACE_NAME),
      subscription: await this.plans.startingSubscription(),
      claimTokenHash: hashSecret(claimToken),
      expiresAt,
      agentKey: { name: SANDBOX_AGENT_KEY_NAME, prefix, hash },
    });
    return created ? { ...created, apiKey: secret, claimToken, expiresAt } : null;
  }

  /** Credited to the agent's key; the address is what the owner will recognise. */
  private recordOpening(opened: OpenedSandbox, storeName: string, email: string): Promise<void> {
    return this.activity.record(opened.workspaceId, Actor.apiKey(opened.apiKeyId), {
      action: ActivityAction.SandboxCreated,
      subject: { type: ActivitySubjectType.Workspace, id: opened.workspaceId, label: storeName },
      detail: email,
    });
  }
}
