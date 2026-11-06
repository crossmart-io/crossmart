import type { Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { TRACKER_SEPARATOR } from './throttling.constants.js';

/**
 * Who a rate limit counts: a person, an API key, or an agent together with the user it acts for,
 * so one agent cannot spend another's budget. Prefixed with the kind: `<kind>:<id>`.
 */
export function principalTracker(principal: Principal): string {
  return [principal.kind, principalTrackerId(principal)].join(TRACKER_SEPARATOR);
}

function principalTrackerId(principal: Principal): string {
  switch (principal.kind) {
    case PrincipalKind.User:
      return principal.userId;
    case PrincipalKind.ApiKey:
      return principal.apiKeyId;
    case PrincipalKind.Agent:
      return [principal.clientId, principal.userId].join(TRACKER_SEPARATOR);
  }
}
