import type { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';

/** Why an unclaimed sandbox account refused an action, and until when it can be claimed. */
export interface SandboxRefusal {
  restriction: SandboxRestriction;
  claimExpiresAt: Date;
  /** Products in the sandbox, for `SandboxRestriction.AddProducts`. */
  productCount?: number;
}

/** Which sandbox to look up: by its workspace or by its organization. */
export type SandboxScope = { workspaceId: string } | { organizationId: string };
