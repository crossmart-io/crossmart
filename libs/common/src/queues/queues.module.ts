import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service.js';
import { QueueName } from './queue-name.enum.js';

const queueRegistrations = Object.values(QueueName).map((name) => ({ name }));

/**
 * Connects to Redis and registers every queue, so both the API (producer)
 * and the worker (consumer) share one definition.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        connection: {
          url: appConfig.redisUrl,
          // Required by BullMQ workers: blocking commands must never time out.
          maxRetriesPerRequest: null,
        },
      }),
    }),
    BullModule.registerQueue(...queueRegistrations),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
