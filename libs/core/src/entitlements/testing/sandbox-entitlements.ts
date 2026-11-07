import type { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';
import { SandboxRestrictedException } from '../errors/sandbox-restricted.exception.js';
import type { EntitlementService } from '../services/entitlement.service.js';

/** The sandbox checks of `EntitlementService`, for tests of the services that call them. */
export type SandboxEntitlements = Pick<
  EntitlementService,
  'assertSandboxAllows' | 'assertSandboxAllowsInOrganization' | 'assertProductRoom'
>;

/** Sandbox checks that pass, as for any workspace that is not an unclaimed sandbox. */
export function noSandboxEntitlements(): {
  [Check in keyof SandboxEntitlements]: ReturnType<typeof vi.fn<SandboxEntitlements[Check]>>;
} {
  return {
    assertSandboxAllows: vi.fn<SandboxEntitlements['assertSandboxAllows']>().mockResolvedValue(),
    assertSandboxAllowsInOrganization: vi
      .fn<SandboxEntitlements['assertSandboxAllowsInOrganization']>()
      .mockResolvedValue(),
    assertProductRoom: vi.fn<SandboxEntitlements['assertProductRoom']>().mockResolvedValue(),
  };
}

/** The refusal of an unclaimed sandbox account, as `EntitlementService` throws it. */
export function sandboxRestricted(restriction: SandboxRestriction): SandboxRestrictedException {
  return new SandboxRestrictedException({
    restriction,
    claimExpiresAt: new Date('2026-11-21T10:00:00.000Z'),
  });
}
