import { Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../config/app-config.service.js';
import { RedisReplayGuard } from './redis-replay.guard.js';
import { ReplayGuard } from './replay-guard.js';

function createRedis(appConfig: AppConfigService): Redis {
  return new Redis(appConfig.redisUrl);
}

/** Closes the connection with the application, so tests and shutdowns do not hang. */
@Injectable()
class RedisConnectionCloser implements OnModuleDestroy {
  constructor(private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * One Redis connection for application state shared across instances (BullMQ keeps its own),
 * and the `ReplayGuard` built on it. Import it where a feature needs either.
 */
@Module({
  providers: [
    { provide: Redis, useFactory: createRedis, inject: [AppConfigService] },
    RedisConnectionCloser,
    { provide: ReplayGuard, useClass: RedisReplayGuard },
  ],
  exports: [Redis, ReplayGuard],
})
export class RedisModule {}
