import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { noSandboxEntitlements } from '../../entitlements/testing/sandbox-entitlements.js';

/** An `EntitlementService` stand-in whose plan always has AI credits left, for tests. */
export function unlimitedEntitlements(): EntitlementService {
  return {
    ...noSandboxEntitlements(),
    assertInWorkspace: vi.fn<EntitlementService['assertInWorkspace']>().mockResolvedValue(),
  } as unknown as EntitlementService;
}
