import type { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import { SANDBOX_ACCOUNTS_PER_DAY, SANDBOX_ACCOUNTS_PER_HOUR } from '../sandbox.constants.js';
import { SANDBOX_THROTTLERS, SandboxThrottlerGuard } from './sandbox-throttler.guard.js';

class ExposedGuard extends SandboxThrottlerGuard {
  tracker(request: Request): Promise<string> {
    return this.getTracker(request);
  }
}

describe('SandboxThrottlerGuard', () => {
  it('counts each caller address in windows of its own', async () => {
    const guard = new ExposedGuard(
      { throttlers: [] } as ThrottlerModuleOptions,
      {} as ThrottlerStorage,
      {} as Reflector,
    );
    const request = {
      header: (name: string) => (name === 'x-real-ip' ? '203.0.113.7' : undefined),
    } as unknown as Request;
    expect(await guard.tracker(request)).toBe('sandbox-ip:203.0.113.7');
  });

  it('allows five an hour and fifty a day', () => {
    expect(SANDBOX_THROTTLERS.map((throttler) => throttler.limit)).toEqual([
      SANDBOX_ACCOUNTS_PER_HOUR,
      SANDBOX_ACCOUNTS_PER_DAY,
    ]);
    expect([SANDBOX_ACCOUNTS_PER_HOUR, SANDBOX_ACCOUNTS_PER_DAY]).toEqual([5, 50]);
  });
});
