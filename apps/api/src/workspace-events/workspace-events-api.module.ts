import { Module } from '@nestjs/common';
import { WorkspaceEventsModule } from '@crossmart/core';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { WorkspacePrincipalThrottlerGuard } from '../common/throttling/workspace-principal-throttler.guard.js';
import { WorkspaceEventsController } from './controllers/workspace-events.controller.js';
import { WorkspaceEventStreamer } from './services/workspace-event-streamer.js';

/** The workspace event stream's routes (ADR 0027): a page to poll, and a live stream. */
@Module({
  imports: [WorkspaceEventsModule, ThrottlingModule],
  controllers: [WorkspaceEventsController],
  providers: [WorkspaceEventStreamer, WorkspacePrincipalThrottlerGuard],
})
export class WorkspaceEventsApiModule {}
