import { Module } from '@nestjs/common';
import { AppConfigModule, QueuesModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { ChannelImportWorkerModule } from './channel-import/channel-import-worker.module.js';
import { SyncModule } from './sync/sync.module.js';

/** Hosts BullMQ processors. Feature processors are added here as domain modules are built. */
@Module({
  imports: [AppConfigModule, DatabaseModule, QueuesModule, ChannelImportWorkerModule, SyncModule],
})
export class WorkerModule {}
