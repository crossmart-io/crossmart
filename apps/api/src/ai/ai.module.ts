import { Module } from '@nestjs/common';
import { AiModule, ContentGenerationModule } from '@crossmart/core';
import { AiController } from './controllers/ai.controller.js';

@Module({
  imports: [AiModule, ContentGenerationModule],
  controllers: [AiController],
})
export class AiApiModule {}
