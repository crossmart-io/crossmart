import { ForbiddenException } from '@nestjs/common';
import { Actor } from '@crossmart/core';
import { PrincipalKind } from './enums/principal-kind.enum.js';
import type { ApiKeyPrincipal, Principal, UserPrincipal } from './entities/principal.js';

/**
 * The user an action is attributed to: the signed-in user, the creator of the API key, or the
 * user an agent acts for.
 */
export function actingUserId(principal: Principal): string {
  return principal.kind === PrincipalKind.ApiKey ? principal.createdById : principal.userId;
}

/** Narrows to a signed-in user, for routes that make no sense for an API key. */
export function requireUser(principal: Principal): UserPrincipal {
  if (principal.kind !== PrincipalKind.User) {
    throw new ForbiddenException('This route needs a signed-in user, not an API key or agent');
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

/** Who the activity log credits: the signed-in user, the API key itself, or the agent. */
export function toActor(principal: Principal): Actor {
  switch (principal.kind) {
    case PrincipalKind.User:
      return Actor.user(principal.userId);
    case PrincipalKind.ApiKey:
      return Actor.apiKey(principal.apiKeyId);
    case PrincipalKind.Agent:
      return Actor.agent(principal.userId, principal.clientId);
  }
}
