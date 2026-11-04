import { ForbiddenException } from '@nestjs/common';
import { Actor } from '@crossmart/core';
import { PrincipalKind } from './enums/principal-kind.enum.js';
import type { ApiKeyPrincipal, Principal, UserPrincipal } from './entities/principal.js';

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

/** Narrows to an API key, for routes that describe the key itself. */
export function requireApiKey(principal: Principal): ApiKeyPrincipal {
  if (principal.kind !== PrincipalKind.ApiKey) {
    throw new ForbiddenException('This route needs an API key, not a signed-in user');
  }
  return principal;
}

/** Who the activity log credits: the signed-in user, or the API key itself. */
export function toActor(principal: Principal): Actor {
  return principal.kind === PrincipalKind.User
    ? Actor.user(principal.userId)
    : Actor.apiKey(principal.apiKeyId);
}
