import { Injectable } from '@nestjs/common';
import { SANDBOX_MAX_PRODUCTS } from '../entitlements.constants.js';
import type { SandboxScope } from '../entities/sandbox-refusal.js';
import { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';
import { SandboxRestrictedException } from '../errors/sandbox-restricted.exception.js';
import { SandboxStatusRepository } from '../repositories/sandbox-status.repository.js';

/**
 * What an unclaimed sandbox account may not do (ADR 0019). Unlike plan limits, these always
 * apply, whatever `ENTITLEMENTS_ENFORCED` says: they guard an account nobody has signed in to.
 */
@Injectable()
export class SandboxPolicy {
  constructor(private readonly sandboxes: SandboxStatusRepository) {}

  /** Throws `SandboxRestrictedException` (403) when the scope is an unclaimed sandbox. */
  async assertAllows(scope: SandboxScope, restriction: SandboxRestriction): Promise<void> {
    const sandbox = await this.sandboxes.findUnclaimed(scope);
    if (sandbox) {
      throw new SandboxRestrictedException({ restriction, claimExpiresAt: sandbox.expiresAt });
    }
  }

  /** Throws when `increment` more products would take a sandbox past `SANDBOX_MAX_PRODUCTS`. */
  async assertProductRoom(workspaceId: string, increment: number): Promise<void> {
    if (increment <= 0) return;
    const sandbox = await this.sandboxes.findUnclaimed({ workspaceId });
    if (!sandbox) return;
    const productCount = await this.sandboxes.countProducts(workspaceId);
    if (productCount + increment <= SANDBOX_MAX_PRODUCTS) return;
    throw new SandboxRestrictedException({
      restriction: SandboxRestriction.AddProducts,
      claimExpiresAt: sandbox.expiresAt,
      productCount,
    });
  }
}
