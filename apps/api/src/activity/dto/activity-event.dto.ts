import { ApiProperty } from '@nestjs/swagger';
import {
  ActivityAction,
  type ActivityActorView,
  type ActivityEventView,
  type ActivityPage,
  ActivitySubjectType,
  type ActivitySubjectView,
} from '@crossmart/core';
import { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import {
  ACTIVITY_ACTION_SCHEMA_NAME,
  ACTIVITY_ACTOR_TYPE_SCHEMA_NAME,
  ACTIVITY_OUTCOME_SCHEMA_NAME,
  ACTIVITY_SUBJECT_TYPE_SCHEMA_NAME,
} from '../activity.constants.js';

export class ActivityActorDto implements ActivityActorView {
  @ApiProperty({ enum: ActivityActorType, enumName: ACTIVITY_ACTOR_TYPE_SCHEMA_NAME })
  type: ActivityActorType;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  apiKeyId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The OAuth client id of the connected agent, for agent actions',
  })
  agentClientId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'User or API key name; for an agent, the user it acted for. Null for system actions and deleted users or keys',
  })
  name: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Set for users, and for the user an agent acted for',
  })
  email: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The agent\'s name, such as "Claude", for agent actions',
  })
  agentName: string | null;
}

export class ActivitySubjectDto implements ActivitySubjectView {
  @ApiProperty({ enum: ActivitySubjectType, enumName: ACTIVITY_SUBJECT_TYPE_SCHEMA_NAME })
  type: ActivitySubjectType;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  id: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The name when the event happened',
  })
  label: string | null;
}

export class ActivityEventDto implements ActivityEventView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ActivityAction, enumName: ACTIVITY_ACTION_SCHEMA_NAME })
  action: ActivityAction;

  @ApiProperty({ enum: ActivityOutcome, enumName: ACTIVITY_OUTCOME_SCHEMA_NAME })
  outcome: ActivityOutcome;

  @ApiProperty({ example: 'Updated product “Linen Shirt”' })
  summary: string;

  @ApiProperty({ type: ActivityActorDto })
  actor: ActivityActorDto;

  @ApiProperty({ type: ActivitySubjectDto, nullable: true })
  subject: ActivitySubjectDto | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Items the action covered, such as products changed in bulk',
  })
  itemCount: number | null;

  @ApiProperty({ type: String, nullable: true, description: 'Why a failed action failed' })
  failureReason: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(event: ActivityEventView): ActivityEventDto {
    return Object.assign(new ActivityEventDto(), {
      ...event,
      actor: Object.assign(new ActivityActorDto(), event.actor),
      subject: event.subject ? Object.assign(new ActivitySubjectDto(), event.subject) : null,
    });
  }
}

export class ActivityPageDto implements ActivityPage {
  @ApiProperty({ type: [ActivityEventDto] })
  items: ActivityEventDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: ActivityPage): ActivityPageDto {
    return Object.assign(new ActivityPageDto(), {
      items: page.items.map((item) => ActivityEventDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
