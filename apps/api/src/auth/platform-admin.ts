import { PrincipalKind } from './enums/principal-kind.enum.js';
import type { Principal } from './entities/principal.js';

/**
 * Whether the caller runs this instance (a platform admin): a signed-in person whose verified
 * email is in `PLATFORM_ADMIN_EMAILS`. API keys and agents never are, whoever created them.
 */
export function isPlatformAdmin(
  principal: Principal | undefined,
  adminEmails: ReadonlySet<string>,
): boolean {
  return (
    principal?.kind === PrincipalKind.User &&
    principal.emailVerified &&
    adminEmails.has(principal.email.toLowerCase())
  );
}
