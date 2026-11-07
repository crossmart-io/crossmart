import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerOptions } from '@nestjs/throttler';
import type { Request } from 'express';
import { clientIp } from '../../common/throttling/client-ip.js';
import { TRACKER_SEPARATOR } from '../../common/throttling/throttling.constants.js';
import {
  SANDBOX_ACCOUNTS_PER_DAY,
  SANDBOX_ACCOUNTS_PER_HOUR,
  SANDBOX_DAY_THROTTLER,
  SANDBOX_DAY_WINDOW_MS,
  SANDBOX_HOUR_THROTTLER,
  SANDBOX_HOUR_WINDOW_MS,
  SANDBOX_TRACKER_KIND,
} from '../sandbox.constants.js';

/** At most 5 sandbox accounts an hour and 50 a day from one caller (ADR 0019). */
export const SANDBOX_THROTTLERS: ThrottlerOptions[] = [
  { name: SANDBOX_HOUR_THROTTLER, ttl: SANDBOX_HOUR_WINDOW_MS, limit: SANDBOX_ACCOUNTS_PER_HOUR },
  { name: SANDBOX_DAY_THROTTLER, ttl: SANDBOX_DAY_WINDOW_MS, limit: SANDBOX_ACCOUNTS_PER_DAY },
];

/**
 * Rate limits for opening sandbox accounts, counted per caller address in Redis so every API
 * instance shares the windows. Every request counts, including those for an address that has an
 * account, so the endpoint cannot be used to test many addresses. It uses its own throttlers,
 * not the module's defaults, so these windows never apply to other routes.
 */
@Injectable()
export class SandboxThrottlerGuard extends ThrottlerGuard implements OnModuleInit {
  override async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.throttlers = SANDBOX_THROTTLERS;
  }

  protected override getTracker(request: Request): Promise<string> {
    return Promise.resolve([SANDBOX_TRACKER_KIND, clientIp(request)].join(TRACKER_SEPARATOR));
  }
}
