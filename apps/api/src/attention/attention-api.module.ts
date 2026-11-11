import { Module } from '@nestjs/common';
import { AttentionModule } from '@crossmart/core';
import { AttentionController } from './controllers/attention.controller.js';

@Module({
  imports: [AttentionModule],
  controllers: [AttentionController],
})
export class AttentionApiModule {}
