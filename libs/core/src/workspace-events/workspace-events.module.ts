import { Module } from '@nestjs/common';
import { WorkspaceEventRepository } from './repositories/workspace-event.repository.js';
import { WorkspaceEventFeed } from './services/workspace-event-feed.js';
import { ActivityEventSource } from './sources/activity-event.source.js';
import { AgentProposalEventSource } from './sources/agent-proposal-event.source.js';
import { AgentWorkerEventSource } from './sources/agent-worker-event.source.js';
import { OrderEventSource } from './sources/order-event.source.js';
import { WebhookFailureEventSource } from './sources/webhook-failure-event.source.js';
import type { WorkspaceEventSource } from './sources/workspace-event-source.js';
import { WORKSPACE_EVENT_SOURCES } from './workspace-events.constants.js';

const SOURCES = [
  ActivityEventSource,
  AgentWorkerEventSource,
  AgentProposalEventSource,
  OrderEventSource,
  WebhookFailureEventSource,
];

/**
 * The workspace event stream (ADR 0027): one timeline of what happens in a workspace, read from
 * the tables that already record it. A new source is a class here; nothing writes to it.
 */
@Module({
  providers: [
    WorkspaceEventRepository,
    ...SOURCES,
    {
      provide: WORKSPACE_EVENT_SOURCES,
      useFactory: (...sources: WorkspaceEventSource[]) => sources,
      inject: SOURCES,
    },
    WorkspaceEventFeed,
  ],
  exports: [WorkspaceEventFeed],
})
export class WorkspaceEventsModule {}
