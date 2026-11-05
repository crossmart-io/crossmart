import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { RedisModule } from '@crossmart/common';
import { AiModule, ContentGenerationModule } from '@crossmart/core';
import { RedisThrottlerStorage } from '../common/throttling/redis-throttler.storage.js';
import { WorkspacePrincipalThrottlerGuard } from '../common/throttling/workspace-principal-throttler.guard.js';
import {
  AI_RATE_LIMITED_MESSAGE,
  AI_THROTTLE_WINDOW_MS,
  CONTENT_DRAFTS_PER_WINDOW,
} from './ai.constants.js';
import { AiController } from './controllers/ai.controller.js';

/**
 * The AI routes. Their rate limits live in Redis and apply only where the controller opts in
 * with `WorkspacePrincipalThrottlerGuard`; no guard is registered globally.
 */
@Module({
  imports: [
    AiModule,
    ContentGenerationModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [Redis],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: AI_THROTTLE_WINDOW_MS, limit: CONTENT_DRAFTS_PER_WINDOW }],
        storage: new RedisThrottlerStorage(redis),
        errorMessage: AI_RATE_LIMITED_MESSAGE,
      }),
    }),
  ],
  controllers: [AiController],
  providers: [WorkspacePrincipalThrottlerGuard],
})
export class AiApiModule {}
