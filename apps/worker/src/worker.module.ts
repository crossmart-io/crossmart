import { Module } from '@nestjs/common';
import { AppConfigModule, QueuesModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';

/** Hosts BullMQ processors. Feature processors are added here as domain modules are built. */
@Module({
  imports: [AppConfigModule, DatabaseModule, QueuesModule],
})
export class WorkerModule {}
