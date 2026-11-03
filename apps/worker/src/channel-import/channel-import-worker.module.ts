import { Module } from '@nestjs/common';
import { ChannelImportModule } from '@crossmart/core';
import { ChannelImportProcessor } from './channel-import.processor.js';
import { StalledImportScheduler } from './stalled-import.scheduler.js';

@Module({
  imports: [ChannelImportModule],
  providers: [ChannelImportProcessor, StalledImportScheduler],
})
export class ChannelImportWorkerModule {}
