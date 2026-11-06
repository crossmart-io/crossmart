import { type ExecutionContext, Injectable, type OnModuleInit } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerOptions } from '@nestjs/throttler';
import { CLIENT_IP_HEADERS } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { principalTracker } from '../../common/throttling/principal-tracker.js';
import { TRACKER_SEPARATOR } from '../../common/throttling/throttling.constants.js';
import {
  ASK_ANONYMOUS_PER_DAY,
  ASK_ANONYMOUS_PER_MINUTE,
  ASK_AUTHENTICATED_PER_DAY,
  ASK_AUTHENTICATED_PER_MINUTE,
  ASK_DAY_THROTTLER,
  ASK_DAY_WINDOW_MS,
  ASK_MINUTE_THROTTLER,
  ASK_MINUTE_WINDOW_MS,
  IP_TRACKER_KIND,
  UNKNOWN_CLIENT_IP,
} from '../ask.constants.js';

function isAuthenticated(context: ExecutionContext): boolean {
  return Boolean(context.switchToHttp().getRequest<AuthenticatedRequest>().principal);
}

/** A limit that is higher for callers who identified themselves. */
function limitFor(anonymous: number, authenticated: number) {
  return (context: ExecutionContext): number =>
    isAuthenticated(context) ? authenticated : anonymous;
}

/** Ask's own windows: a burst limit per minute and a total per day. */
export const ASK_THROTTLERS: ThrottlerOptions[] = [
  {
    name: ASK_MINUTE_THROTTLER,
    ttl: ASK_MINUTE_WINDOW_MS,
    limit: limitFor(ASK_ANONYMOUS_PER_MINUTE, ASK_AUTHENTICATED_PER_MINUTE),
  },
  {
    name: ASK_DAY_THROTTLER,
    ttl: ASK_DAY_WINDOW_MS,
    limit: limitFor(ASK_ANONYMOUS_PER_DAY, ASK_AUTHENTICATED_PER_DAY),
  },
];

/** The caller's address as the edge proxy reports it, else the socket's. */
export function clientIp(request: AuthenticatedRequest): string {
  for (const header of CLIENT_IP_HEADERS) {
    const value = request.header(header);
    if (value) return value.trim();
  }
  return request.ip ?? UNKNOWN_CLIENT_IP;
}

/**
 * Rate limits for Ask Crossmart. Anonymous callers are tracked by IP address, identified ones
 * by person, API key or agent (with higher limits). It uses its own throttlers, not the module's
 * defaults, so Ask's windows never apply to other routes.
 */
@Injectable()
export class AskThrottlerGuard extends ThrottlerGuard implements OnModuleInit {
  override async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.throttlers = ASK_THROTTLERS;
  }

  protected override getTracker(request: AuthenticatedRequest): Promise<string> {
    const { principal } = request;
    if (!principal)
      return Promise.resolve([IP_TRACKER_KIND, clientIp(request)].join(TRACKER_SEPARATOR));
    return Promise.resolve(principalTracker(principal));
  }
}
