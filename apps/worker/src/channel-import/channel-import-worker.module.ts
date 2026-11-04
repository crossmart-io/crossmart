import { Module } from '@nestjs/common';
import { ChannelImportModule } from '@crossmart/core';
import { ChannelImportProcessor } from './channel-import.processor.js';

@Module({
  imports: [ChannelImportModule],
  providers: [ChannelImportProcessor],
})
export class ChannelImportWorkerModule {}
