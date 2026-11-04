import { ForbiddenException } from '@nestjs/common';
import { PrincipalKind } from './enums/principal-kind.enum.js';
import type { Principal, UserPrincipal } from './entities/principal.js';

/** The user an action is attributed to: the signed-in user, or the creator of the API key. */
export function actingUserId(principal: Principal): string {
  return principal.kind === PrincipalKind.User ? principal.userId : principal.createdById;
}

/** Narrows to a signed-in user, for routes that make no sense for an API key. */
export function requireUser(principal: Principal): UserPrincipal {
  if (principal.kind !== PrincipalKind.User) {
    throw new ForbiddenException('This route needs a signed-in user, not an API key');
  }
  return principal;
}
