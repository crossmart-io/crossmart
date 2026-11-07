import { HttpException, HttpStatus } from '@nestjs/common';
import { FORBIDDEN_ERROR } from '../entitlements.constants.js';
import type { SandboxRefusal } from '../entities/sandbox-refusal.js';
import { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import type { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';
import { sandboxRefusalMessage } from '../rules/sandbox-message.js';

/** The body of a sandbox refusal: NestJS's error shape plus what the agent needs to say. */
export interface SandboxErrorBody {
  statusCode: HttpStatus.FORBIDDEN;
  error: string;
  code: EntitlementErrorCode.SandboxClaimRequired;
  message: string;
  restriction: SandboxRestriction;
  /** When the claim link stops working and the sandbox is deleted. */
  claimExpiresAt: string;
}

/**
 * The workspace is an unclaimed sandbox account (ADR 0019) and the action waits for its owner.
 * HTTP 403 with `code: sandbox_claim_required`: neither a permission an admin can grant nor a
 * plan an upgrade fixes, only claiming the account.
 */
export class SandboxRestrictedException extends HttpException {
  constructor(readonly refusal: SandboxRefusal) {
    super(SandboxRestrictedException.body(refusal), HttpStatus.FORBIDDEN);
    this.name = 'SandboxRestrictedException';
  }

  private static body(refusal: SandboxRefusal): SandboxErrorBody {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      error: FORBIDDEN_ERROR,
      code: EntitlementErrorCode.SandboxClaimRequired,
      message: sandboxRefusalMessage(refusal),
      restriction: refusal.restriction,
      claimExpiresAt: refusal.claimExpiresAt.toISOString(),
    };
  }
}
