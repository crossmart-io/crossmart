import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { RedisModule } from '@crossmart/common';
import { rateLimitMessageFor } from './rate-limit-message.decorator.js';
import { RedisThrottlerStorage } from './redis-throttler.storage.js';
import { DEFAULT_REQUESTS_PER_WINDOW, DEFAULT_THROTTLE_WINDOW_MS } from './throttling.constants.js';

/**
 * Rate limiting for the API, with windows in Redis shared by every instance. Registered once
 * (the throttler module is global); limits apply only where a route opts in with a throttler
 * guard and usually its own `@Throttle()`. No guard is registered globally.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [Redis],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: DEFAULT_THROTTLE_WINDOW_MS, limit: DEFAULT_REQUESTS_PER_WINDOW }],
        storage: new RedisThrottlerStorage(redis),
        errorMessage: rateLimitMessageFor,
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlingModule {}
