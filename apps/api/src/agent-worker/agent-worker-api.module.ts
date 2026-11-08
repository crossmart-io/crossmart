import { Module } from '@nestjs/common';
import { AgentWorkerModule } from '@crossmart/core';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { WorkspaceThrottlerGuard } from '../common/throttling/workspace-throttler.guard.js';
import { AgentWorkerController } from './controllers/agent-worker.controller.js';
import { LoopbackToolExecutor } from './services/loopback-tool.executor.js';

/** Agent Worker's routes (ADR 0026); its tools call this API over the loopback interface. */
@Module({
  imports: [AgentWorkerModule.register({ executor: LoopbackToolExecutor }), ThrottlingModule],
  controllers: [AgentWorkerController],
  providers: [WorkspaceThrottlerGuard],
})
export class AgentWorkerApiModule {}
