import { Module } from '@nestjs/common';
import { AppConfigModule, MailModule, QueuesModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { AiWorkerModule } from './ai/ai-worker.module.js';
import { MaintenanceWorkerModule } from './agents/maintenance-worker.module.js';
import { ChannelImportWorkerModule } from './channel-import/channel-import-worker.module.js';
import { OrdersWorkerModule } from './orders/orders-worker.module.js';
import { SyncModule } from './sync/sync.module.js';

/** Hosts BullMQ processors. Feature processors are added here as domain modules are built. */
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    // Domain modules the processors use can send email, such as tenancy's invitations.
    MailModule,
    QueuesModule,
    ChannelImportWorkerModule,
    MaintenanceWorkerModule,
    OrdersWorkerModule,
    SyncModule,
    AiWorkerModule,
  ],
})
export class WorkerModule {}
