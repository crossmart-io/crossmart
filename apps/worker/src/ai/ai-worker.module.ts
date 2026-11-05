import { Module } from '@nestjs/common';
import { ContentGenerationModule } from '@crossmart/core';
import { ContentGenerationProcessor } from './content-generation.processor.js';

@Module({
  imports: [ContentGenerationModule],
  providers: [ContentGenerationProcessor],
})
export class AiWorkerModule {}
