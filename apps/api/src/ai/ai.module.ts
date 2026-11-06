import { Module } from '@nestjs/common';
import { AiModule, ContentGenerationModule } from '@crossmart/core';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { WorkspacePrincipalThrottlerGuard } from '../common/throttling/workspace-principal-throttler.guard.js';
import { AiController } from './controllers/ai.controller.js';

/** The AI routes, rate limited per workspace and caller where the controller opts in. */
@Module({
  imports: [AiModule, ContentGenerationModule, ThrottlingModule],
  controllers: [AiController],
  providers: [WorkspacePrincipalThrottlerGuard],
})
export class AiApiModule {}
