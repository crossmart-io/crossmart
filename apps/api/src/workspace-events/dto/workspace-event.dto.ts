import { ApiProperty } from '@nestjs/swagger';
import {
  encodeEventCursor,
  type WorkspaceEvent,
  type WorkspaceEventActor,
  WorkspaceEventCategory,
  type WorkspaceEventPage,
  type WorkspaceEventRefs,
  WorkspaceEventSeverity,
  WorkspaceEventType,
} from '@crossmart/core';
import { ActivityActorType } from '@crossmart/database';
import { ACTIVITY_ACTOR_TYPE_SCHEMA_NAME } from '../../activity/activity.constants.js';
import {
  WORKSPACE_EVENT_CATEGORY_SCHEMA_NAME,
  WORKSPACE_EVENT_SEVERITY_SCHEMA_NAME,
  WORKSPACE_EVENT_TYPE_SCHEMA_NAME,
} from '../workspace-events.constants.js';

const NULLABLE_UUID = { type: String, format: 'uuid', nullable: true } as const;

export class WorkspaceEventActorDto implements WorkspaceEventActor {
  @ApiProperty({ enum: ActivityActorType, enumName: ACTIVITY_ACTOR_TYPE_SCHEMA_NAME })
  type: ActivityActorType;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The person or API key; for an agent, the person it acted for',
  })
  name: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Crossmart Agent',
    description:
      'The agent, for agent actions: "Crossmart Agent", or a connected agent such as "Claude"',
  })
  agentName: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "Who approved the outside agent's proposal that made the change, if anyone",
  })
  approvedByName: string | null;
}

export class WorkspaceEventRefsDto implements WorkspaceEventRefs {
  @ApiProperty({ ...NULLABLE_UUID, description: 'The store (channel connection)' })
  connectionId: string | null;

  @ApiProperty(NULLABLE_UUID)
  productId: string | null;

  @ApiProperty(NULLABLE_UUID)
  orderId: string | null;

  @ApiProperty(NULLABLE_UUID)
  webhookEndpointId: string | null;

  @ApiProperty({ ...NULLABLE_UUID, description: 'Your Crossmart Agent conversation' })
  conversationId: string | null;

  @ApiProperty({ ...NULLABLE_UUID, description: 'The Crossmart Agent tool call' })
  actionId: string | null;

  @ApiProperty({ ...NULLABLE_UUID, description: "An outside agent's proposal" })
  proposalId: string | null;
}

/** One thing that happened in the workspace. */
export class WorkspaceEventDto implements WorkspaceEvent {
  @ApiProperty({ example: 'activity:0193f7c2-…', description: 'Stable across reads' })
  id: string;

  @ApiProperty({ description: 'Pass as `after` (or `Last-Event-ID`) to read what follows it' })
  cursor: string;

  @ApiProperty({ enum: WorkspaceEventType, enumName: WORKSPACE_EVENT_TYPE_SCHEMA_NAME })
  type: WorkspaceEventType;

  @ApiProperty({ enum: WorkspaceEventCategory, enumName: WORKSPACE_EVENT_CATEGORY_SCHEMA_NAME })
  category: WorkspaceEventCategory;

  @ApiProperty({ enum: WorkspaceEventSeverity, enumName: WORKSPACE_EVENT_SEVERITY_SCHEMA_NAME })
  severity: WorkspaceEventSeverity;

  @ApiProperty({ example: 'Published “Linen Shirt” on Outlet' })
  summary: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'More to read: the store’s error, what a read found, an order’s total',
  })
  detail: string | null;

  @ApiProperty({ type: WorkspaceEventActorDto })
  actor: WorkspaceEventActorDto;

  @ApiProperty({ type: WorkspaceEventRefsDto, description: 'What the event is about' })
  refs: WorkspaceEventRefsDto;

  @ApiProperty({ type: Number, nullable: true, description: 'Items the event covered' })
  itemCount: number | null;

  @ApiProperty()
  occurredAt: Date;

  static from(event: WorkspaceEvent): WorkspaceEventDto {
    return Object.assign(new WorkspaceEventDto(), {
      ...event,
      cursor: encodeEventCursor({ occurredAt: event.occurredAt, id: event.id }),
      actor: Object.assign(new WorkspaceEventActorDto(), event.actor),
      refs: Object.assign(new WorkspaceEventRefsDto(), event.refs),
    });
  }
}

export class WorkspaceEventPageDto implements WorkspaceEventPage {
  @ApiProperty({ type: [WorkspaceEventDto], description: 'Oldest first' })
  items: WorkspaceEventDto[];

  @ApiProperty({
    description: 'Pass as `after` to read what happens next; it moves on even when nothing did',
  })
  cursor: string;

  static from(page: WorkspaceEventPage): WorkspaceEventPageDto {
    return Object.assign(new WorkspaceEventPageDto(), {
      items: page.items.map((item) => WorkspaceEventDto.from(item)),
      cursor: page.cursor,
    });
  }
}

/** The `ready` event of the stream: the backlog is out, and this is where it stands. */
export class WorkspaceEventStreamReadyDto {
  @ApiProperty()
  cursor: string;
}
